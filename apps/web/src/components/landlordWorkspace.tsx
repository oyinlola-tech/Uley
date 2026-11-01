'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { WEB_API_BASE_PATH, WEB_API_ENDPOINTS, WEB_AUTH_STORAGE_KEYS, WEB_PROPERTY_IMAGE_UPLOAD } from '../constants';
import { VerificationStatus } from '../enums/verificationStatus.enum';
import { RENTAL_PERIOD_LABELS, RentalPeriod } from '../enums/rentalPeriod.enum';
import { WEB_ERROR_MESSAGES, getUserFacingErrorMessage, getApiResponseErrorMessage } from '../errors';
import styles from './landlordWorkspace.module.css';
import { ProductIllustration } from './productIllustration';
import { clearLocalPropertyDraft, readLocalPropertyDraft, saveLocalPropertyDraft } from '../storage/propertyDraft.storage';
import type { LocalPropertyDraft } from '../models/localPropertyDraft.model';
import { useQueuedPropertyImages } from '../hooks/useQueuedPropertyImages';
import { savePropertyDraftFormOnDevice } from '../utils/propertyDraftForm';
import { PropertyCaretakerManager } from './propertyCaretakerManager';

type Verification = { status: VerificationStatus; rejectionReason?: string | null } | null;
type Unit = { id: string; name: string; rentAmount: string; rentalPeriod: string; securityDeposit: string; monthlyServiceCharge: string; inspectionFee: string; bedrooms: number; bathrooms: number; isAvailable: boolean };
type ManagedProperty = { id: string; name: string; description: string; streetAddress: string; neighborhood: string; city: string; state: string; latitude?: number | null; longitude?: number | null; status: string; verification: Verification; units: Unit[]; images: { id: string; imageUrl: string; altText: string }[] };
type WorkspaceData = { verification: Verification; properties: ManagedProperty[] };
const createFields = [
  ['name', 'Property name'], ['description', 'Description'], ['streetAddress', 'Street address'],
  ['neighborhood', 'Neighborhood'], ['city', 'City'], ['state', 'State'], ['unitName', 'Available unit name'],
] as const;

export function LandlordWorkspace() {
  const [data, setData] = useState<WorkspaceData>({ verification: null, properties: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [propertyCoordinates, setPropertyCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [draftSaveStatus, setDraftSaveStatus] = useState('Draft stays on this device until it can sync.');
  const propertyDraftForm = useRef<HTMLFormElement>(null);
  const landlordApproved = data.verification?.status === VerificationStatus.APPROVED;

  const refreshWorkspace = useCallback(async () => {
    const token = getAccessToken();
    if (!token) { setError(WEB_ERROR_MESSAGES.signInLandlordRequired); setIsLoading(false); return; }
    try {
      const [verification, properties] = await Promise.all([
        requestWorkspaceApi<{ verification: Verification }>(WEB_API_ENDPOINTS.landlordVerification, token),
        requestWorkspaceApi<{ properties: ManagedProperty[] }>(WEB_API_ENDPOINTS.landlordProperties, token),
      ]);
      setData({ verification: verification.verification, properties: properties.properties });
    } catch (requestError) { setError(getUserFacingErrorMessage(requestError, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void refreshWorkspace(); }, [refreshWorkspace]);
  const { pendingImages: queuedImages, progress: queuedImageProgress, queueImage } = useQueuedPropertyImages({ properties: data.properties, refreshWorkspace });

  const syncLocalPropertyDraft = useCallback(async () => {
    if (!navigator.onLine || !propertyDraftForm.current || !landlordApproved) return;
    const localDraft = readLocalPropertyDraft();
    if (!localDraft) return;
    try {
      const { savedAt: _savedAt, propertyId, clientDraftId, ...propertyInput } = localDraft;
      const endpoint = propertyId ? `${WEB_API_ENDPOINTS.landlordProperties}/${propertyId}` : WEB_API_ENDPOINTS.landlordProperties;
      await requestWorkspaceApi(endpoint, getAccessToken(), {
        ...(propertyId ? {} : { clientDraftId }),
        ...propertyInput, rentAmount: Number(localDraft.rentAmount),
        securityDeposit: Number(localDraft.securityDeposit ?? 0), monthlyServiceCharge: Number(localDraft.monthlyServiceCharge ?? 0),
        inspectionFee: Number(localDraft.inspectionFee ?? 0),
        bedrooms: Number(localDraft.bedrooms), bathrooms: Number(localDraft.bathrooms),
      }, propertyId ? 'PUT' : 'POST');
      clearLocalPropertyDraft();
      propertyDraftForm.current.reset();
      setEditingPropertyId(null);
      setDraftSaveStatus('Draft synced to your property workspace.');
      await refreshWorkspace();
    } catch { setDraftSaveStatus('Saved on this device. Sync will retry when you are online.'); }
  }, [landlordApproved, refreshWorkspace]);

  useEffect(() => {
    if (!landlordApproved) return;
    const savedDraft = readLocalPropertyDraft();
    if (savedDraft && propertyDraftForm.current) {
      setEditingPropertyId(savedDraft.propertyId ?? null);
      for (const [name, value] of Object.entries(savedDraft)) {
        const input = propertyDraftForm.current.elements.namedItem(name);
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) input.value = String(value);
      }
      if (savedDraft.latitude !== undefined && savedDraft.longitude !== undefined) {
        setPropertyCoordinates({ latitude: savedDraft.latitude, longitude: savedDraft.longitude });
      }
      setDraftSaveStatus('Draft restored from this device.');
    }
    const retrySyncWhenOnline = () => { void syncLocalPropertyDraft(); };
    window.addEventListener('online', retrySyncWhenOnline);
    void syncLocalPropertyDraft();
    return () => window.removeEventListener('online', retrySyncWhenOnline);
  }, [landlordApproved, syncLocalPropertyDraft]);

  async function requestVerification() {
    setError('');
    try {
      await requestWorkspaceApi(WEB_API_ENDPOINTS.landlordVerification, getAccessToken(), {});
      setNotice('Your request is in the school review queue. Keep your identity documents ready for the school’s verification process.');
      await refreshWorkspace();
    } catch (requestError) { setError(getUserFacingErrorMessage(requestError, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
  }

  async function createProperty(formData: FormData) {
    setError(''); setNotice('');
    const body: Record<string, FormDataEntryValue | number> = Object.fromEntries(formData.entries());
    const savedDraft = readLocalPropertyDraft();
    body.clientDraftId = savedDraft?.clientDraftId ?? crypto.randomUUID();
    for (const field of ['rentAmount', 'securityDeposit', 'monthlyServiceCharge', 'inspectionFee', 'bedrooms', 'bathrooms']) body[field] = Number(body[field] ?? 0);
    if (propertyCoordinates) { body.latitude = propertyCoordinates.latitude; body.longitude = propertyCoordinates.longitude; }
    try {
      const targetPropertyId = savedDraft?.propertyId;
      if (targetPropertyId) delete body.clientDraftId;
      const endpoint = targetPropertyId ? `${WEB_API_ENDPOINTS.landlordProperties}/${targetPropertyId}` : WEB_API_ENDPOINTS.landlordProperties;
      const result = await requestWorkspaceApi<{ property: ManagedProperty }>(endpoint, getAccessToken(), body, targetPropertyId ? 'PUT' : 'POST');
      setPropertyCoordinates(null);
      setEditingPropertyId(null);
      clearLocalPropertyDraft();
      propertyDraftForm.current?.reset();
      setDraftSaveStatus('Draft synced to your property workspace.');
      setNotice(`Draft saved for ${result.property.name}. Add a photo to begin school review.`);
      await refreshWorkspace();
    } catch (requestError) { setError(getUserFacingErrorMessage(requestError, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
  }

  async function uploadPropertyImage(propertyId: string, formData: FormData) {
    const file = formData.get('image');
    const altText = String(formData.get('altText') ?? '').trim();
    if (!(file instanceof File) || !file.size || !altText) { setError(WEB_ERROR_MESSAGES.propertyImageAndDescriptionRequired); return; }
    if (file.size > WEB_PROPERTY_IMAGE_UPLOAD.maximumFileSizeBytes) { setError(WEB_ERROR_MESSAGES.propertyImageTooLarge); return; }
    const property = data.properties.find((item) => item.id === propertyId);
    const pendingCount = queuedImages.filter((image) => image.propertyId === propertyId).length;
    if ((property?.images.length ?? 0) + pendingCount >= WEB_PROPERTY_IMAGE_UPLOAD.maximumImagesPerProperty) { setError(WEB_ERROR_MESSAGES.propertyImageLimitReached); return; }
    try {
      await queueImage(propertyId, file, altText);
      setNotice('Photo saved on this device. Upload and safety scanning will continue when connected.');
    } catch (uploadError) { setError(getUserFacingErrorMessage(uploadError, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
  }

  async function submitProperty(propertyId: string) {
    try { await requestWorkspaceApi(`${WEB_API_ENDPOINTS.landlordProperties}/${propertyId}${WEB_API_ENDPOINTS.propertySubmitAction}`, getAccessToken(), {}); setNotice('Property sent to the school for review. It will appear publicly after approval.'); await refreshWorkspace(); }
    catch (requestError) { setError(getUserFacingErrorMessage(requestError, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
  }

  async function updateUnitAvailability(unitId: string, isAvailable: boolean) {
    try { await requestWorkspaceApi(`${WEB_API_ENDPOINTS.landlordProperties}/${unitId}${WEB_API_ENDPOINTS.unitAvailabilityAction}`, getAccessToken(), { isAvailable }); setNotice(`Unit marked ${isAvailable ? 'available' : 'unavailable'}.`); await refreshWorkspace(); }
    catch (requestError) { setError(getUserFacingErrorMessage(requestError, WEB_ERROR_MESSAGES.requestFailedPleaseRetry)); }
  }

  function loadPropertyDraftIntoForm(property: ManagedProperty) {
    const unit = property.units[0];
    if (!unit || !propertyDraftForm.current) return;
    const localDraft: LocalPropertyDraft = {
      clientDraftId: crypto.randomUUID(), propertyId: property.id, name: property.name, description: property.description,
      streetAddress: property.streetAddress, neighborhood: property.neighborhood, city: property.city, state: property.state,
      unitName: unit.name, rentAmount: String(unit.rentAmount), rentalPeriod: unit.rentalPeriod,
      securityDeposit: String(unit.securityDeposit), monthlyServiceCharge: String(unit.monthlyServiceCharge),
      inspectionFee: String(unit.inspectionFee), bedrooms: String(unit.bedrooms), bathrooms: String(unit.bathrooms),
      ...(property.latitude != null && property.longitude != null ? { latitude: property.latitude, longitude: property.longitude } : {}),
      savedAt: new Date().toISOString(),
    };
    saveLocalPropertyDraft(localDraft);
    setEditingPropertyId(property.id);
    for (const [name, value] of Object.entries(localDraft)) {
      const input = propertyDraftForm.current.elements.namedItem(name);
      if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) input.value = String(value);
    }
    setPropertyCoordinates(localDraft.latitude !== undefined && localDraft.longitude !== undefined ? { latitude: localDraft.latitude, longitude: localDraft.longitude } : null);
    setDraftSaveStatus('Editing a saved draft. Changes will sync when online.');
    propertyDraftForm.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function capturePropertyCoordinates() {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setPropertyCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
      if (propertyDraftForm.current) savePropertyDraftFormOnDevice(propertyDraftForm.current, coords.latitude, coords.longitude);
      setNotice('This device location will be saved as the property pin. Capture it while you are at the property.');
    }, () => setError('Location access was not granted. You can save the property without a map pin.'), { enableHighAccuracy: true, timeout: 12000 });
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}><Link href="/" className={styles.brand}>Uley <span>LANDLORD WORKSPACE</span></Link><Link href="/landlord/inspections">Inspection requests ↗</Link><Link href="/landlord/applications">Rental applications ↗</Link><Link href="/landlord/complaints">Housing issues ↗</Link><Link href="/landlord/ads">Promote a home ↗</Link><Link href="/listings">View listings ↗</Link></header>
      <section className={styles.intro}><div className={styles.introCopy}><p>PROPERTY DESK · SCHOOL VERIFIED</p><h1>Make the details clear<br /><span>before students visit.</span></h1><div className={styles.status}><strong>Landlord review</strong><span>{data.verification?.status ?? 'NOT REQUESTED'}</span></div>{data.verification?.rejectionReason && <p className={styles.reason}>{data.verification.rejectionReason}</p>}{!landlordApproved && <button onClick={() => void requestVerification()} disabled={data.verification?.status === VerificationStatus.PENDING}>Request landlord verification</button>}</div><ProductIllustration scene="landlordDesk" /></section>
      {error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.notice} role="status">{notice}</p>}{queuedImageProgress && <p className={styles.notice} role="status">{queuedImageProgress}</p>}
      {landlordApproved && <section className={styles.panel}><p className={styles.eyebrow}>{editingPropertyId ? 'EDIT PROPERTY DRAFT' : 'NEW PROPERTY'}</p><h2>{editingPropertyId ? 'Update property details' : 'Start with one available unit'}</h2><p>{draftSaveStatus}</p><form ref={propertyDraftForm} action={async (formData) => { await createProperty(formData); }} onChange={(event) => savePropertyDraftFormOnDevice(event.currentTarget)} className={styles.form}>{createFields.map(([name, label]) => <label key={name}>{label}{name === 'description' ? <textarea name={name} minLength={20} maxLength={2000} required /> : <input name={name} required minLength={name === 'name' ? 3 : 2} />}</label>)}<label>Rent amount (₦)<input type="number" name="rentAmount" min="1" step="100" required /></label><label>Rent period<select name="rentalPeriod" defaultValue="YEAR">{Object.entries(RENTAL_PERIOD_LABELS).map(([period, label]) => <option key={period} value={period}>{label}</option>)}</select></label><label>Refundable security deposit (₦)<input type="number" name="securityDeposit" min="0" step="100" defaultValue="0" required /></label><label>Monthly service charge (₦)<input type="number" name="monthlyServiceCharge" min="0" step="100" defaultValue="0" required /></label><label>Inspection fee (₦)<input type="number" name="inspectionFee" min="0" step="100" defaultValue="0" required /></label><label>Bedrooms<input type="number" name="bedrooms" min="0" max="20" required /></label><label>Bathrooms<input type="number" name="bathrooms" min="0" max="20" required /></label><button type="button" onClick={capturePropertyCoordinates}>{propertyCoordinates ? 'Property pin captured' : 'Capture property pin from this device'}</button><button disabled={isLoading}>Save property draft</button><button type="button" onClick={() => { clearLocalPropertyDraft(); propertyDraftForm.current?.reset(); setPropertyCoordinates(null); setEditingPropertyId(null); setDraftSaveStatus('Draft stays on this device until it can sync.'); }}>Start a new property draft</button></form></section>}
      {!!queuedImageProgress && <p className={styles.notice} role="status">{queuedImageProgress}</p>}{!!queuedImages.length && <p className={styles.notice} role="status">{queuedImages.length} photo{queuedImages.length === 1 ? '' : 's'} safely saved on this device. They remain private until scanning finishes.</p>}
      <section className={styles.properties}><p className={styles.eyebrow}>YOUR SUBMISSIONS</p><h2>Property review status</h2>{isLoading ? <p>Loading your submissions…</p> : data.properties.length === 0 ? <p>No properties submitted yet.</p> : data.properties.map((property) => <article key={property.id}><div><h3>{property.name}</h3><p>{property.city} · {property.units.length} unit</p><strong>{property.status.replaceAll('_', ' ')}</strong><p>{property.verification?.rejectionReason}</p>{property.units.map((unit) => <p key={unit.id}>{unit.name} · {unit.isAvailable ? 'Available' : 'Unavailable'} <button onClick={() => void updateUnitAvailability(unit.id, !unit.isAvailable)}>{unit.isAvailable ? 'Pause listing' : 'Mark available'}</button></p>)}{property.images?.map((image) => <Image key={image.id} src={image.imageUrl} alt={image.altText} width={120} height={90} unoptimized />)}</div>{property.status === 'DRAFT' && <><button onClick={() => loadPropertyDraftIntoForm(property)}>Edit property details</button><form action={async (formData) => uploadPropertyImage(property.id, formData)}><label>Photo description<input name="altText" required maxLength={255} /></label><label>Property photo<input name="image" type="file" accept={WEB_PROPERTY_IMAGE_UPLOAD.acceptedContentTypes} required /></label><button>Save and upload photo</button></form><button disabled={!property.images?.length} onClick={() => void submitProperty(property.id)}>Submit for school review</button></>}<PropertyCaretakerManager propertyId={property.id} /></article>)}</section>
    </main>
  );
}

function getAccessToken() { return window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken) ?? ''; }
async function requestWorkspaceApi<T>(endpoint: string, token: string, body?: unknown, method?: 'POST' | 'PUT'): Promise<T> {
  const response = await fetch(`${WEB_API_BASE_PATH}${endpoint}`, { method: body === undefined ? 'GET' : method ?? 'POST', headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), authorization: `Bearer ${token}` }, body: body === undefined ? undefined : JSON.stringify(body) });
  const payload = await response.json().catch(() => null) as { error?: { message?: string }; requestId?: string } | T | null;
  if (!response.ok) { const failure = payload as { error?: { message?: string }; requestId?: string } | null; throw new Error(getApiResponseErrorMessage(failure?.error?.message ?? WEB_ERROR_MESSAGES.requestFailedPleaseRetry, response.status, failure?.requestId)); }
  return payload as T;
}
