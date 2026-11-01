import { createHmac, timingSafeEqual } from 'node:crypto';
import { applicationEnvironment } from '../../../configs/env.config.js';
import { SPONSORED_CAMPAIGN_LIMITS } from '../../../constants/sponsoredCampaign.constant.js';
import { ServiceUnavailableError, UnauthorizedError, ValidationError } from '../../../errors/app.error.js';
import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { applyVerifiedSponsoredCheckoutPayment, findSponsoredCheckoutByProviderId } from '../../../repositories/sponsoredCampaignCheckout.repository.js';
import { applyVerifiedUserAdvertisementCheckoutPayment, findUserAdvertisementCheckoutByProviderId } from '../../../repositories/userAdvertisementCheckout.repository.js';

type BachsCheckout = { checkout_id?: string; checkout_url?: string; reference?: string; status?: string; payment_status?: string; amount?: string; currency?: string; expires_at?: string };
type BachsResponse = BachsCheckout & { detail?: string; error_code?: string };

export async function createBachsSponsoredCheckout(input: { email: string; reference: string; checkoutId: string; amountKobo: bigint; checkoutType?: 'sponsored_campaign' | 'user_advertisement' }) {
  requirePaymentConfiguration();
  const response = await fetch(`${getBachsApiBaseUrl()}/checkout-sessions`, {
    method: 'POST', signal: AbortSignal.timeout(15_000),
    headers: { authorization: `Bearer ${applicationEnvironment.bachsApiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ pricing: { currency: SPONSORED_CAMPAIGN_LIMITS.checkoutCurrency, amount: formatKoboAsCurrency(input.amountKobo) }, customer: { email: input.email }, reference: input.reference, metadata: { checkout_type: input.checkoutType ?? 'sponsored_campaign', internal_checkout_id: input.checkoutId }, expires_in_minutes: 30, ...getReturnUrls(input.reference, input.checkoutType) }),
  });
  const result = await response.json().catch(() => null) as BachsResponse | null;
  const checkoutUrl = result?.checkout_url;
  if (!response.ok || !result?.checkout_id || !checkoutUrl || !isBachsCheckoutUrl(checkoutUrl)) throw new ServiceUnavailableError(ERROR_MESSAGES.sponsoredCampaignPaymentCouldNotStart);
  const expiresAt = result.expires_at ? new Date(result.expires_at) : new Date(Date.now() + SPONSORED_CAMPAIGN_LIMITS.checkoutExpiryMilliseconds);
  if (Number.isNaN(expiresAt.getTime())) throw new ServiceUnavailableError(ERROR_MESSAGES.sponsoredCampaignPaymentCouldNotStart);
  return { providerCheckoutId: result.checkout_id, authorizationUrl: checkoutUrl, expiresAt };
}

export async function verifyBachsSponsoredCheckout(input: { reference: string; providerCheckoutId: string }) {
  requirePaymentConfiguration();
  const response = await fetch(`${getBachsApiBaseUrl()}/checkout-sessions/${encodeURIComponent(input.providerCheckoutId)}`, { headers: { authorization: `Bearer ${applicationEnvironment.bachsApiKey}` }, signal: AbortSignal.timeout(15_000) });
  const result = await response.json().catch(() => null) as BachsResponse | null;
  if (!response.ok || !result) throw new ServiceUnavailableError(ERROR_MESSAGES.sponsoredCampaignPaymentStatusUnavailable);
  if (result.reference !== input.reference) throw new ValidationError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
  if (result.payment_status !== 'succeeded') return { paid: false };
  const amountKobo = parseCurrencyAmountKobo(result.amount);
  if (!amountKobo || result.currency !== SPONSORED_CAMPAIGN_LIMITS.checkoutCurrency) throw new ValidationError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
  const checkout = await applyVerifiedSponsoredCheckoutPayment({ reference: input.reference, amountKobo, currency: result.currency });
  return { paid: true, checkout };
}

export async function verifyBachsUserAdvertisementCheckout(input: { reference: string; providerCheckoutId: string }) {
  requirePaymentConfiguration();
  const response = await fetch(`${getBachsApiBaseUrl()}/checkout-sessions/${encodeURIComponent(input.providerCheckoutId)}`, { headers: { authorization: `Bearer ${applicationEnvironment.bachsApiKey}` }, signal: AbortSignal.timeout(15_000) });
  const result = await response.json().catch(() => null) as BachsResponse | null;
  if (!response.ok || !result) throw new ServiceUnavailableError(ERROR_MESSAGES.sponsoredCampaignPaymentStatusUnavailable);
  if (result.reference !== input.reference) throw new ValidationError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
  if (result.payment_status !== 'succeeded') return { paid: false };
  const amountKobo = parseCurrencyAmountKobo(result.amount);
  if (!amountKobo || result.currency !== SPONSORED_CAMPAIGN_LIMITS.checkoutCurrency) throw new ValidationError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
  const checkout = await applyVerifiedUserAdvertisementCheckoutPayment({ reference: input.reference, amountKobo, currency: result.currency });
  return { paid: true, checkout };
}

export async function acceptBachsWebhook(input: { rawBody?: Buffer; signature?: string; signatureV2?: string; timestamp?: string }) {
  requirePaymentConfiguration();
  if (!input.rawBody || !isValidBachsSignature({ ...input, rawBody: input.rawBody })) throw new UnauthorizedError(ERROR_MESSAGES.unauthorized);
  let event: { type?: string; data?: { checkout_id?: string; status?: string; amount?: string; currency?: string } };
  try { event = JSON.parse(input.rawBody.toString('utf8')) as typeof event; }
  catch { throw new ValidationError(); }
  if (event.type !== 'collection.succeeded') return { accepted: true };
  const providerCheckoutId = event.data?.checkout_id;
  const amountKobo = parseCurrencyAmountKobo(event.data?.amount);
  if (!providerCheckoutId || !amountKobo || event.data?.currency !== SPONSORED_CAMPAIGN_LIMITS.checkoutCurrency || event.data.status !== 'SUCCEEDED') throw new ValidationError(ERROR_MESSAGES.sponsoredCampaignCheckoutUnavailable);
  const checkout = await findSponsoredCheckoutByProviderId(providerCheckoutId);
  if (checkout) { await applyVerifiedSponsoredCheckoutPayment({ reference: checkout.reference, amountKobo, currency: event.data.currency }); return { accepted: true }; }
  const userAdCheckout = await findUserAdvertisementCheckoutByProviderId(providerCheckoutId);
  if (userAdCheckout) await applyVerifiedUserAdvertisementCheckoutPayment({ reference: userAdCheckout.reference, amountKobo, currency: event.data.currency });
  return { accepted: true };
}


function isValidBachsSignature(input: { rawBody: Buffer; signature?: string; signatureV2?: string; timestamp?: string }) {
  const parsedV2 = input.signatureV2?.split(',').map((part) => part.trim().split('=', 2) as [string, string]);
  const timestamp = parsedV2?.find(([key]) => key === 't')?.[1] ?? input.timestamp;
  const signatures = parsedV2?.filter(([key]) => key === 'v1').map(([, value]) => value) ?? (input.signature ? [input.signature] : []);
  if (!timestamp || !/^\d{10}$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > SPONSORED_CAMPAIGN_LIMITS.webhookSignatureToleranceSeconds) return false;
  const expected = createHmac('sha256', applicationEnvironment.bachsWebhookSecret).update(`${timestamp}.`).update(input.rawBody).digest();
  return signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const received = Buffer.from(signature, 'hex');
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
}

function parseCurrencyAmountKobo(value?: string) {
  if (!value || !/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, '0'));
}

function formatKoboAsCurrency(amountKobo: bigint) { return `${amountKobo / 100n}.${(amountKobo % 100n).toString().padStart(2, '0')}`; }
function getBachsApiBaseUrl() {
  if (!['https://api.bachs.io/v1', 'https://sandbox-api.bachs.io/v1'].includes(applicationEnvironment.bachsApiBaseUrl)) throw new ServiceUnavailableError(ERROR_MESSAGES.sponsoredCampaignPaymentsNotConfigured);
  return applicationEnvironment.bachsApiBaseUrl;
}
function isBachsCheckoutUrl(value: string) {
  try { const url = new URL(value); return url.protocol === 'https:' && SPONSORED_CAMPAIGN_LIMITS.checkoutUrlHosts.some((hostname) => hostname === url.hostname); }
  catch { return false; }
}
function getReturnUrls(reference: string, checkoutType?: 'sponsored_campaign' | 'user_advertisement') {
  if (!applicationEnvironment.webAppBaseUrl) return {};
  try {
    const callbackPath = checkoutType === 'user_advertisement' ? '/ads' : SPONSORED_CAMPAIGN_LIMITS.paymentCallbackPath;
    const successUrl = new URL(callbackPath, applicationEnvironment.webAppBaseUrl);
    if (!successUrl.hostname.includes('.') || ['localhost', '127.0.0.1'].includes(successUrl.hostname)) return {};
    successUrl.searchParams.set('reference', reference);
    const cancelUrl = new URL(successUrl);
    cancelUrl.searchParams.set('checkout', 'cancelled');
    return { success_url: successUrl.toString(), cancel_url: cancelUrl.toString() };
  } catch { return {}; }
}
function requirePaymentConfiguration() {
  if (!applicationEnvironment.bachsApiKey || !applicationEnvironment.bachsWebhookSecret) throw new ServiceUnavailableError(ERROR_MESSAGES.sponsoredCampaignPaymentsNotConfigured);
}
