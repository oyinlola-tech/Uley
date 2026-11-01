import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowUpRight, ChatCircleDots, Megaphone } from 'phosphor-react-native';
import { MOBILE_API_ENDPOINTS } from '../constants';
import { requestUleyApi } from '../auth/api';
import type { PublicUserAdvertisement } from '../models';
import { MOBILE_COMMUNITY_AD_ERROR_MESSAGES } from '../errors';
import { useMobileTheme } from '../theme';

export function CommunityAdCard({ ad, accessToken, onConversation }: { ad: PublicUserAdvertisement; accessToken: string | null; onConversation: (id: string) => void }) {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const advertiserName = ad.advertiser.businessAdvertiserProfile?.businessName || ad.advertiser.fullName;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { if (accessToken) void recordEvent(ad.id, 'IMPRESSION', accessToken); }, [ad.id, accessToken]);

  async function openAdAction() {
    if (!accessToken) { setError('Sign in as a student to contact this advertiser.'); return; }
    await recordEvent(ad.id, 'CLICK', accessToken);
    if (ad.ctaUrl) {
      try { await Linking.openURL(ad.ctaUrl); }
      catch { setError(MOBILE_COMMUNITY_AD_ERROR_MESSAGES.websiteUnavailable); }
      return;
    }
    setBusy(true);
    try {
      const result = await requestUleyApi<{ conversation: { id: string } }>(`${MOBILE_API_ENDPOINTS.userAdvertisements}/${ad.id}${MOBILE_API_ENDPOINTS.userAdvertisementContactAction}`, {}, accessToken);
      onConversation(result.conversation.id);
    } catch (failure) { setError(failure instanceof Error ? failure.message : MOBILE_COMMUNITY_AD_ERROR_MESSAGES.contactUnavailable); }
    finally { setBusy(false); }
  }

  async function reportAd() {
    if (!accessToken) { setError('Sign in to report this ad.'); return; }
    try { await requestUleyApi(MOBILE_API_ENDPOINTS.contentReports, { userAdvertisementId: ad.id, reason: 'OTHER', details: 'Reported from the community ad.' }, accessToken); setError(''); setNotice('Report sent to the school safety team.'); }
    catch { setError('Unable to submit this report.'); }
  }

  const category = ad.category === 'JOB' ? 'STUDENT OPPORTUNITY' : ad.category === 'SKILL' ? 'STUDENT SERVICE' : 'LOCAL BUSINESS';
  return <View style={styles.card}>
    <View style={styles.topline}><View style={styles.label}><Megaphone size={13} color={colors.primary} weight="fill" /><Text style={styles.sponsored}>PAID COMMUNITY AD</Text></View><Text style={styles.category}>{category}</Text></View>
    {ad.imageUrl && <Image source={{ uri: ad.imageUrl }} style={styles.image} accessibilityLabel={`Image for ${ad.title}`} />}
    <View style={styles.body}><View style={styles.owner}><Text style={styles.avatar}>{advertiserName.trim().charAt(0).toUpperCase()}</Text><View><Text style={styles.ownerName}>{advertiserName}</Text><Text style={styles.ownerMeta}>{ad.advertiser.university?.name ?? 'Uley community'} · {ad.city}</Text></View></View>
      <Text style={styles.title}>{ad.title}</Text><Text style={styles.description}>{ad.description}</Text>
      {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
      {!!notice && <Text style={styles.notice} accessibilityRole="status">{notice}</Text>}
      <Pressable accessibilityRole="button" style={styles.action} onPress={() => void openAdAction()} disabled={busy}>{ad.ctaUrl ? <ArrowUpRight size={15} color="#fff" weight="bold" /> : <ChatCircleDots size={15} color="#fff" />}<Text style={styles.actionText}>{busy ? 'Opening chat…' : ad.ctaLabel}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => void reportAd()}><Text style={styles.report}>Report this ad</Text></Pressable>
    </View>
  </View>;
}

async function recordEvent(advertisementId: string, eventType: 'IMPRESSION' | 'CLICK', token: string) {
  try { await requestUleyApi(`${MOBILE_API_ENDPOINTS.userAdvertisements}/${advertisementId}${MOBILE_API_ENDPOINTS.userAdvertisementEventAction}`, { eventType }, token); } catch { /* Ad tracking must not interrupt listing browsing. */ }
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  card: { overflow: 'hidden', marginBottom: 15, borderWidth: 1, borderColor: colors.line, borderTopWidth: 3, borderTopColor: colors.primary, borderRadius: 14, backgroundColor: colors.surface },
  image: { width: '100%', height: 190, backgroundColor: colors.paper },
  topline: { minHeight: 39, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, borderBottomWidth: 1, borderColor: colors.line },
  label: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sponsored: { color: colors.primary, fontSize: 8, fontWeight: '800', letterSpacing: .5 },
  category: { color: colors.muted, fontSize: 7, fontWeight: '700' },
  body: { padding: 14 },
  owner: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  avatar: { width: 31, height: 31, paddingTop: 7, overflow: 'hidden', borderRadius: 18, backgroundColor: colors.paper, color: colors.primary, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  ownerName: { color: colors.ink, fontSize: 10, fontWeight: '800' },
  ownerMeta: { marginTop: 2, color: colors.muted, fontSize: 8 },
  title: { marginTop: 14, color: colors.ink, fontSize: 18, lineHeight: 22, fontWeight: '800' },
  description: { marginTop: 6, color: colors.muted, fontSize: 10, lineHeight: 16 },
  action: { minHeight: 39, alignSelf: 'flex-start', marginTop: 13, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 9, backgroundColor: colors.action },
  actionText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  error: { marginTop: 7, color: colors.error, fontSize: 9 },
  notice: { marginTop: 7, color: colors.trust, fontSize: 9 },
  report: { marginTop: 10, color: colors.muted, fontSize: 10, textDecorationLine: 'underline' },
}); }
