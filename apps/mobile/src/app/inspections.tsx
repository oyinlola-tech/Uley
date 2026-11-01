import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthPageHeading } from '../components/AuthPageHeading';
import { LabeledInput } from '../components/LabeledInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenFrame } from '../components/ScreenFrame';
import { useUleyAuth } from '../auth/AuthProvider';
import { requestUleyApi } from '../auth/api';
import { MOBILE_API_ENDPOINTS } from '../constants';
import { AccountRole, InspectionStatus } from '../enums';
import type { InspectionRecord } from '../models';
import { MOBILE_ERROR_MESSAGES } from '../errors';
import { useMobileTheme } from '../theme';
import { InspectionLocationControl } from '../components/inspectionLocationControl';
import { InspectionLifecycleActions } from '../components/inspectionLifecycleActions';
import { NotificationInbox } from '../components/notificationInbox';
import { RentalApplicationActions } from '../components/rentalApplicationActions';

export default function InspectionsScreen() {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const { account, accessToken, isRestoringSession } = useUleyAuth();
  const { unitId, propertyName, unitName } = useLocalSearchParams<{ unitId?: string; propertyName?: string; unitName?: string }>();
  const [requests, setRequests] = useState<InspectionRecord[]>([]);
  const [visitTime, setVisitTime] = useState('');
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const landlord = account?.userRole === AccountRole.LANDLORD;
  const endpoint = landlord ? MOBILE_API_ENDPOINTS.landlordInspections : MOBILE_API_ENDPOINTS.inspections;
  const loadRequests = useCallback(async () => {
    if (!accessToken) return;
    try { setRequests((await requestUleyApi<{ inspections: InspectionRecord[] }>(endpoint, undefined, accessToken)).inspections); }
    catch (failure) { setError(failure instanceof Error ? failure.message : MOBILE_ERROR_MESSAGES.inspectionsUnavailable); }
  }, [accessToken, endpoint]);

  useEffect(() => {
    if (isRestoringSession) return;
    if (!account) { router.replace({ pathname: '/login', params: { next: `/inspections?unitId=${encodeURIComponent(String(unitId ?? ''))}&propertyName=${encodeURIComponent(String(propertyName ?? ''))}&unitName=${encodeURIComponent(String(unitName ?? ''))}` } }); return; }
    if (![AccountRole.STUDENT, AccountRole.LANDLORD].includes(account.userRole)) { router.replace('/account'); return; }
    void loadRequests();
  }, [account, isRestoringSession, loadRequests, propertyName, unitId, unitName]);

  async function sendRequest() {
    if (!accessToken || !unitId) return;
    setError(''); setNotice(''); setBusy(true);
    try {
      await requestUleyApi(MOBILE_API_ENDPOINTS.inspections, { unitId, scheduledFor: parseLocalVisitTime(visitTime).toISOString(), studentMessage: message.trim() }, accessToken);
      setNotice(MOBILE_ERROR_MESSAGES.inspectionRequestSent); setVisitTime(''); setMessage(''); await loadRequests();
    } catch (failure) { setError(failure instanceof Error ? failure.message : MOBILE_ERROR_MESSAGES.requestFailed); }
    finally { setBusy(false); }
  }

  async function respond(inspectionId: string, decision: 'CONFIRMED' | 'DECLINED') {
    if (!accessToken) return;
    setError(''); setBusy(true);
    try { await requestUleyApi(`${endpoint}/${inspectionId}${MOBILE_API_ENDPOINTS.inspectionResponseAction}`, { decision }, accessToken); await loadRequests(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : MOBILE_ERROR_MESSAGES.requestFailed); }
    finally { setBusy(false); }
  }

  return <ScreenFrame><AuthPageHeading eyebrow={landlord ? 'LANDLORD VISIT DESK' : 'PLAN A VIEWING'} title={landlord ? 'Respond to inspection requests.' : 'Visit the home before you apply.'} description={landlord ? 'Confirm or decline a requested time so students know what to expect.' : 'Choose a preferred time and the landlord will respond to your request.'} backPath={landlord ? '/landlord' : '/listings'} />
    <Pressable style={styles.applicationLink} onPress={() => router.push((landlord ? '/landlord-applications' : '/applications') as never)}><Text style={styles.applicationLinkText}>{landlord ? 'Review rental applications →' : 'View my applications →'}</Text></Pressable>
    {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}{!!notice && <Text style={styles.notice}>{notice}</Text>}
    {!landlord && unitId && <View style={styles.panel}><Text style={styles.title}>{propertyName || 'Selected home'}{unitName ? ` · ${unitName}` : ''}</Text><LabeledInput label="Preferred time (YYYY-MM-DD HH:mm)" placeholder="2026-11-14 14:30" value={visitTime} onChangeText={setVisitTime} /><LabeledInput label="Message (optional)" placeholder="Anything the landlord should know" value={message} onChangeText={setMessage} multiline numberOfLines={3} /><PrimaryButton label="Send inspection request" onPress={() => void sendRequest()} disabled={busy || !visitTime} loading={busy} /></View>}
    {accessToken && <NotificationInbox accessToken={accessToken} />}<View style={styles.panel}><Text style={styles.title}>{landlord ? 'Requests for your properties' : 'Your inspection requests'}</Text>{requests.length === 0 ? <Text style={styles.copy}>No inspection requests yet. Browse homes and arrange a visit when you find a suitable place.</Text> : requests.map((request) => <InspectionCard key={request.id} request={request} landlord={landlord} role={account?.userRole ?? AccountRole.STUDENT} accessToken={accessToken ?? ''} busy={busy} onRespond={respond} onUpdated={loadRequests} styles={styles} />)}</View>
  </ScreenFrame>;
}

function InspectionCard({ request, landlord, role, accessToken, busy, onRespond, onUpdated, styles }: { request: InspectionRecord; landlord: boolean; role: AccountRole; accessToken: string; busy: boolean; onRespond: (id: string, decision: 'CONFIRMED' | 'DECLINED') => void; onUpdated: () => void; styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.request}><Text style={styles.status}>{request.status.replaceAll('_', ' ')}</Text><Text style={styles.title}>{request.property.name} · {request.unit.name}</Text><Text style={styles.copy}>{new Date(request.scheduledFor).toLocaleString()}{request.student ? ` · ${request.student.fullName}` : ''}</Text>{request.studentMessage && <Text style={styles.copy}>{request.studentMessage}</Text>}{request.landlordResponse && <Text style={styles.copy}>{request.landlordResponse}</Text>}{landlord && request.status === InspectionStatus.REQUESTED && <View style={styles.actions}><Pressable disabled={busy} onPress={() => onRespond(request.id, 'CONFIRMED')}><Text style={styles.action}>Confirm</Text></Pressable><Pressable disabled={busy} onPress={() => onRespond(request.id, 'DECLINED')}><Text style={styles.action}>Decline</Text></Pressable></View>}<InspectionLifecycleActions inspectionId={request.id} scheduledFor={request.scheduledFor} propertyId={request.property.id} status={request.status} occupancyId={request.occupancy?.id} occupancyStatus={request.occupancy?.status} paymentConfirmed={Boolean(request.occupancy?.paymentConfirmedAt)} reviewed={Boolean(request.occupancy?.review)} pendingRescheduleId={request.rescheduleRequests?.find((change) => change.status === 'PENDING')?.id} role={role} accessToken={accessToken} onUpdated={onUpdated}/>{!landlord && <RentalApplicationActions inspectionId={request.id} status={request.status} feedback={request.feedback} application={request.rentalApplication} occupancyId={request.occupancy?.id} accessToken={accessToken} onUpdated={onUpdated}/>}<InspectionLocationControl inspectionId={request.id} status={request.status} role={role} accessToken={accessToken} /></View>;
}
function parseLocalVisitTime(value: string) { const [date, time] = value.trim().split(/\s+/); if (!date || !time) throw new Error('Enter a date and time in the displayed format.'); return new Date(`${date}T${time}:00`); }
function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  panel: { marginHorizontal: 20, marginBottom: 18, padding: 20, borderWidth: 1, borderColor: colors.line, borderRadius: 18, backgroundColor: colors.surface }, applicationLink: { marginHorizontal: 20, marginBottom: 15 }, applicationLinkText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  title: { marginBottom: 10, color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: '800' }, copy: { marginTop: 6, color: colors.muted, fontSize: 11, lineHeight: 17 }, status: { marginBottom: 6, color: colors.trust, fontSize: 9, fontWeight: '800', letterSpacing: 1 }, request: { paddingVertical: 14, borderTopWidth: 1, borderColor: colors.line }, actions: { flexDirection: 'row', gap: 22, marginTop: 13 }, action: { color: colors.primary, fontSize: 12, fontWeight: '800' }, error: { marginHorizontal: 20, marginBottom: 13, color: colors.error, fontSize: 12 }, notice: { marginHorizontal: 20, marginBottom: 13, color: colors.trust, fontSize: 12 },
}); }
