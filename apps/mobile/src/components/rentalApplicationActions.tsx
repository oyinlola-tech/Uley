import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { requestUleyApi } from '../auth/api';
import { MOBILE_API_ENDPOINTS, MOBILE_RENTAL_APPLICATION_COPY } from '../constants';
import { MOBILE_ERROR_MESSAGES } from '../errors';
import { InspectionStatus } from '../enums';
import { useMobileTheme } from '../theme';

export function RentalApplicationActions({ inspectionId, status, feedback, application, occupancyId, accessToken, onUpdated }: { inspectionId: string; status: InspectionStatus; feedback?: { outcome: string } | null; application?: { id: string; status: string } | null; occupancyId?: string; accessToken: string; onUpdated: () => void }) {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const [moveInDate, setMoveInDate] = useState('');
  const [studentMessage, setStudentMessage] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const canApply = status === InspectionStatus.COMPLETED && ['INTERESTED', 'NEEDS_FOLLOW_UP'].includes(feedback?.outcome ?? '') && !application && !occupancyId;
  async function apply() {
    setBusy(true); setMessage('');
    try {
      await requestUleyApi(MOBILE_API_ENDPOINTS.rentalApplications, { inspectionId, ...(moveInDate ? { moveInDate: new Date(`${moveInDate}T00:00:00`).toISOString() } : {}), ...(studentMessage.trim() ? { studentMessage: studentMessage.trim() } : {}) }, accessToken);
      setMessage(MOBILE_RENTAL_APPLICATION_COPY.submitted); onUpdated();
    } catch (failure) { setMessage(failure instanceof Error ? failure.message : MOBILE_ERROR_MESSAGES.rentalApplicationSubmitFailed); }
    finally { setBusy(false); }
  }
  if (!canApply) return application ? <Text style={styles.copy}>Application: {application.status.toLowerCase().replaceAll('_', ' ')}. Track it in your Applications page.</Text> : null;
  return <View style={styles.panel}><Text style={styles.title}>Ready to apply after your visit?</Text><TextInput style={styles.input} placeholder="Preferred move-in date (YYYY-MM-DD)" placeholderTextColor={colors.muted} value={moveInDate} onChangeText={setMoveInDate} /><TextInput style={[styles.input, styles.multiline]} placeholder="Note to landlord (optional)" placeholderTextColor={colors.muted} multiline maxLength={1500} value={studentMessage} onChangeText={setStudentMessage} /><Pressable style={styles.button} onPress={() => void apply()} disabled={busy}><Text style={styles.buttonText}>{busy ? 'Sending…' : 'Apply for this home'}</Text></Pressable>{!!message && <Text style={styles.copy} accessibilityRole="alert">{message}</Text>}</View>;
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({ panel: { gap: 10, marginTop: 12, padding: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.surface }, title: { color: colors.ink, fontSize: 13, fontWeight: '800' }, input: { padding: 11, borderWidth: 1, borderColor: colors.line, borderRadius: 8, color: colors.ink, backgroundColor: colors.surface, fontSize: 12 }, multiline: { minHeight: 70, textAlignVertical: 'top' }, button: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 8, backgroundColor: colors.primary }, buttonText: { color: '#fff', fontSize: 12, fontWeight: '800' }, copy: { color: colors.muted, fontSize: 11, lineHeight: 17 } }); }
