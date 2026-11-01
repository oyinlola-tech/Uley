import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { requestUleyApi } from '../auth/api';
import { useUleyAuth } from '../auth/AuthProvider';
import { MOBILE_API_ENDPOINTS, MOBILE_RENTAL_APPLICATION_COPY } from '../constants';
import { MOBILE_ERROR_MESSAGES } from '../errors';
import { AccountRole, RentalApplicationStatus } from '../enums';
import { useMobileTheme } from '../theme';
import type { RentalApplicationRecord } from '../models';
import { AuthPageHeading } from './AuthPageHeading';
import { ScreenFrame } from './ScreenFrame';

export function RentalApplicationWorkspace({ landlord }: { landlord: boolean }) {
  const { colors } = useMobileTheme(); const styles = createStyles(colors); const { account, accessToken, isRestoringSession } = useUleyAuth();
  const [applications, setApplications] = useState<RentalApplicationRecord[]>([]); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [busyId, setBusyId] = useState('');
  const endpoint = landlord ? MOBILE_API_ENDPOINTS.landlordRentalApplications : MOBILE_API_ENDPOINTS.rentalApplications;
  const refresh = useCallback(async () => { if (!accessToken) return; try { setApplications((await requestUleyApi<{ applications: RentalApplicationRecord[] }>(endpoint, undefined, accessToken)).applications); } catch (failure) { setError(failure instanceof Error ? failure.message : MOBILE_ERROR_MESSAGES.rentalApplicationsUnavailable); } }, [accessToken, endpoint]);
  useEffect(() => { if (isRestoringSession) return; if (!account || account.userRole !== (landlord ? AccountRole.LANDLORD : AccountRole.STUDENT)) { router.replace('/account'); return; } void refresh(); }, [account, isRestoringSession, landlord, refresh]);
  async function act(application: RentalApplicationRecord, status: string, response: string) {
    if (!accessToken) return; setBusyId(application.id); setError(''); setNotice('');
    try {
      const path = landlord ? `${endpoint}/${application.id}${MOBILE_API_ENDPOINTS.rentalApplicationResponseAction}` : `${endpoint}/${application.id}${MOBILE_API_ENDPOINTS.rentalApplicationWithdrawAction}`;
      await requestUleyApi(path, landlord ? { status, ...(response.trim() ? { landlordResponse: response.trim() } : {}) } : {}, accessToken);
      setNotice(landlord ? status === 'APPROVED' ? MOBILE_RENTAL_APPLICATION_COPY.approved : status === 'DECLINED' ? MOBILE_RENTAL_APPLICATION_COPY.declined : MOBILE_RENTAL_APPLICATION_COPY.underReview : MOBILE_RENTAL_APPLICATION_COPY.withdrawn); await refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : MOBILE_ERROR_MESSAGES.rentalApplicationUpdateFailed); }
    finally { setBusyId(''); }
  }
  return <ScreenFrame><AuthPageHeading eyebrow={landlord ? 'LANDLORD APPLICATION DESK' : 'YOUR HOME SEARCH'} title={landlord ? MOBILE_RENTAL_APPLICATION_COPY.landlordTitle : MOBILE_RENTAL_APPLICATION_COPY.studentTitle} description={landlord ? MOBILE_RENTAL_APPLICATION_COPY.landlordDescription : MOBILE_RENTAL_APPLICATION_COPY.studentDescription} backPath={landlord ? '/landlord' : '/inspections'} />
    {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}{!!notice && <Text style={styles.notice}>{notice}</Text>}
    <ScrollView contentContainerStyle={styles.list}>{applications.length === 0 ? <Text style={styles.empty}>{landlord ? MOBILE_RENTAL_APPLICATION_COPY.landlordEmpty : MOBILE_RENTAL_APPLICATION_COPY.studentEmpty}</Text> : applications.map((application) => <ApplicationCard key={application.id} application={application} landlord={landlord} busy={busyId === application.id} onAction={act} styles={styles} />)}</ScrollView>
  </ScreenFrame>;
}

function ApplicationCard({ application, landlord, busy, onAction, styles }: { application: RentalApplicationRecord; landlord: boolean; busy: boolean; onAction: (application: RentalApplicationRecord, status: string, response: string) => void; styles: ReturnType<typeof createStyles> }) {
  const [response, setResponse] = useState(''); const active = [RentalApplicationStatus.SUBMITTED, RentalApplicationStatus.UNDER_REVIEW].includes(application.status);
  return <View style={styles.card}><Text style={styles.status}>{application.status.replaceAll('_', ' ')}</Text><Text style={styles.title}>{application.property.name} · {application.unit.name}</Text><Text style={styles.copy}>{application.property.neighborhood}, {application.property.city}</Text><Text style={styles.copy}>{formatRent(application.unit.rentAmount, application.unit.rentalPeriod)} · Inspection {formatNaira(application.unit.inspectionFee)} · Deposit {formatNaira(application.unit.securityDeposit)}</Text><Text style={styles.copy}>Visit {new Date(application.inspection.scheduledFor).toLocaleString()}</Text>{application.moveInDate && <Text style={styles.copy}>Preferred move-in {new Date(application.moveInDate).toLocaleDateString()}</Text>}{landlord && <Text style={styles.copy}>Applicant: {application.student.fullName} · {application.student.email}</Text>}{!!application.studentMessage && <Text style={styles.message}>{application.studentMessage}</Text>}{!!application.landlordResponse && <Text style={styles.copy}>Landlord: {application.landlordResponse}</Text>}
    {landlord && active && <><TextInput style={[styles.input, styles.multiline]} placeholder="Optional note to student" placeholderTextColor={styles.muted.color} multiline value={response} onChangeText={setResponse} maxLength={1000} /><View style={styles.row}><Action label="Review" busy={busy} onPress={() => onAction(application, 'UNDER_REVIEW', response)} styles={styles} /><Action label="Approve" busy={busy} onPress={() => onAction(application, 'APPROVED', response)} styles={styles} /><Action label="Decline" busy={busy} onPress={() => onAction(application, 'DECLINED', response)} styles={styles} /></View></>}
    {!landlord && active && <Action label="Withdraw application" busy={busy} onPress={() => onAction(application, 'WITHDRAWN', '')} styles={styles} />}
  </View>;
}

function Action({ label, busy, onPress, styles }: { label: string; busy: boolean; onPress: () => void; styles: ReturnType<typeof createStyles> }) { return <Pressable disabled={busy} style={styles.button} onPress={onPress}><Text style={styles.buttonText}>{busy ? 'Saving…' : label}</Text></Pressable>; }
function formatRent(amount: string, period: string) { return `${formatNaira(amount)} / ${period === 'YEAR' ? 'year' : period.toLowerCase()}`; }
function formatNaira(amount: string) { return `₦${Number(amount).toLocaleString('en-NG')}`; }
function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({ list: { gap: 12, paddingHorizontal: 20, paddingBottom: 40 }, empty: { color: colors.muted, fontSize: 13, lineHeight: 20 }, card: { gap: 8, padding: 16, borderWidth: 1, borderColor: colors.line, borderRadius: 16, backgroundColor: colors.surface }, status: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 }, title: { color: colors.ink, fontSize: 16, fontWeight: '800' }, copy: { color: colors.muted, fontSize: 11, lineHeight: 17 }, muted: { color: colors.muted }, message: { color: colors.ink, fontSize: 12, lineHeight: 18 }, input: { padding: 11, borderWidth: 1, borderColor: colors.line, borderRadius: 9, color: colors.ink }, multiline: { minHeight: 65, textAlignVertical: 'top' }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, button: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.primary }, buttonText: { color: '#fff', fontSize: 11, fontWeight: '800' }, error: { marginHorizontal: 20, color: colors.error, fontSize: 12 }, notice: { marginHorizontal: 20, color: colors.trust, fontSize: 12 } }); }
