import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { requestUleyApi } from '../auth/api';
import { MOBILE_API_ENDPOINTS } from '../constants';
import { InspectionStatus, AccountRole } from '../enums';
import { useMobileTheme } from '../theme';

export function InspectionLifecycleActions({ inspectionId, scheduledFor, propertyId, status, occupancyId, occupancyStatus, paymentConfirmed, reviewed, pendingRescheduleId, role, accessToken, onUpdated }: { inspectionId: string; scheduledFor: string; propertyId: string; status: InspectionStatus; occupancyId?: string; occupancyStatus?: string; paymentConfirmed?: boolean; reviewed?: boolean; pendingRescheduleId?: string; role: AccountRole; accessToken: string; onUpdated: () => void }) {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const [date, setDate] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [outcome, setOutcome] = useState('INTERESTED');
  const [payment, setPayment] = useState(false);
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const student = role === AccountRole.STUDENT;
  async function save(path: string, body: unknown) {
    setBusy(true); setNotice('');
    try { await requestUleyApi(path, body, accessToken); setNotice('Saved.'); onUpdated(); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Unable to save. Try again.'); }
    finally { setBusy(false); }
  }
  const button = (label: string, action: () => void, secondary = false) => <Pressable key={label} disabled={busy} style={[styles.button, secondary && styles.secondary]} onPress={action}><Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text></Pressable>;
  return <View style={styles.wrap}>
    {student && (status === InspectionStatus.CONFIRMED || status === InspectionStatus.MISSED) && <><TextInput style={styles.input} placeholder="New time: YYYY-MM-DD HH:mm" placeholderTextColor={colors.muted} value={date} onChangeText={setDate}/>{button('Request another time', () => { const [day, time] = date.split(' '); if (!day || !time) { setNotice('Enter a date and time in the displayed format.'); return; } void save(`${MOBILE_API_ENDPOINTS.inspections}/${inspectionId}${MOBILE_API_ENDPOINTS.inspectionRescheduleAction}`, { proposedFor: new Date(`${day}T${time}:00`).toISOString() }); })}</>}
    {student && status === InspectionStatus.CONFIRMED && new Date(scheduledFor) < new Date() && <>{button('Mark visit missed', () => void save(`${MOBILE_API_ENDPOINTS.inspections}/${inspectionId}${MOBILE_API_ENDPOINTS.inspectionMissedAction}`, {}), true)}<Text style={styles.copy}>Visit outcome</Text><View style={styles.row}>{['INTERESTED','NOT_INTERESTED','NEEDS_FOLLOW_UP','SECURED'].map((value) => button(value.replaceAll('_',' '), () => setOutcome(value), outcome !== value))}</View><TextInput style={styles.input} placeholder="Move-in date (YYYY-MM-DD if secured)" placeholderTextColor={colors.muted} value={moveInDate} onChangeText={setMoveInDate}/><TextInput style={[styles.input, styles.multiline]} placeholder="Notes about the viewing" placeholderTextColor={colors.muted} multiline value={comment} onChangeText={setComment}/>{button('Report that payment was made', () => setPayment(!payment), !payment)}{button('Save visit outcome', () => void save(`${MOBILE_API_ENDPOINTS.inspections}/${inspectionId}${MOBILE_API_ENDPOINTS.inspectionFeedbackAction}`, { outcome, ...(comment ? { comment } : {}), ...(moveInDate ? { moveInDate: new Date(`${moveInDate}T12:00:00`).toISOString() } : {}), paymentReported: payment }))}</>}
    {student && occupancyId && <Text style={styles.copy}>Move-in: {occupancyStatus?.toLowerCase().replaceAll('_',' ')}. Payment confirmation and review moderation protect the review badge.</Text>}
    {student && occupancyId && occupancyStatus === 'ACTIVE' && paymentConfirmed && !reviewed && <><Text style={styles.copy}>Rate this verified home: {rating} stars</Text><View style={styles.row}>{[1,2,3,4,5].map((star) => button(`${star} ★`, () => setRating(star), rating !== star))}</View><TextInput style={[styles.input, styles.multiline]} placeholder="Share a helpful, honest review (25 characters minimum)" placeholderTextColor={colors.muted} multiline value={comment} onChangeText={setComment}/>{button('Submit home review', () => void save(`${MOBILE_API_ENDPOINTS.studentOccupancies}/${occupancyId}/reviews`, { rating, comment }))}</>}
    {!student && pendingRescheduleId && <>{button('Accept new visit time', () => void save(`${MOBILE_API_ENDPOINTS.landlordInspections}${MOBILE_API_ENDPOINTS.inspectionRescheduleResponseAction}/${pendingRescheduleId}/respond`, { decision: 'ACCEPTED' }))}{button('Decline new time', () => void save(`${MOBILE_API_ENDPOINTS.landlordInspections}${MOBILE_API_ENDPOINTS.inspectionRescheduleResponseAction}/${pendingRescheduleId}/respond`, { decision: 'DECLINED' }), true)}</>}
    {!student && occupancyId && occupancyStatus === 'REQUESTED' && <><TextInput style={styles.input} placeholder="Payment amount confirmed by you (₦), optional" placeholderTextColor={colors.muted} keyboardType="numeric" value={amount} onChangeText={setAmount}/>{button(payment ? 'Payment confirmation enabled' : 'Confirm payment (optional)', () => setPayment(!payment), !payment)}{button('Confirm student move-in', () => void save(`${MOBILE_API_ENDPOINTS.landlordOccupancies}/${occupancyId}/respond`, { decision: 'CONFIRMED', paymentConfirmed: payment, ...(payment && amount ? { paymentAmount: Number(amount) } : {}) }))}{button('Decline move-in record', () => void save(`${MOBILE_API_ENDPOINTS.landlordOccupancies}/${occupancyId}/respond`, { decision: 'DECLINED', paymentConfirmed: false }), true)}</>}
    {!!notice && <Text style={styles.notice}>{notice}</Text>}
  </View>;
}
function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({ wrap: { gap: 9, marginVertical: 12, padding: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.surface }, input: { minHeight: 42, padding: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 8, color: colors.ink, backgroundColor: colors.paper, fontSize: 12 }, multiline: { minHeight: 76, textAlignVertical: 'top' }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, button: { minHeight: 35, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 8, backgroundColor: colors.action }, buttonText: { color: colors.onAction, fontSize: 10, fontWeight: '800' }, secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }, secondaryText: { color: colors.ink }, copy: { color: colors.muted, fontSize: 11, lineHeight: 16 }, notice: { color: colors.trust, fontSize: 11 } }); }
