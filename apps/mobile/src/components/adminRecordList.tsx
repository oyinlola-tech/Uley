import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { requestUleyApi } from '../auth/api';
import { useUleyAuth } from '../auth/AuthProvider';
import { ADMIN_MOBILE_COPY } from '../constants/adminWorkspaceCopy.constant';
import { ADMIN_MOBILE_LIMITS } from '../constants';
import { ADMIN_MOBILE_ERROR_MESSAGES } from '../errors';
import type { AdminRecord, AdminRecordAction } from '../models';
import { useMobileTheme } from '../theme';

export function AdminRecordList({ records, loading, error, onRefresh }: { records: AdminRecord[]; loading: boolean; error: string; onRefresh: () => Promise<void> }) {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const { accessToken } = useUleyAuth();
  const [selectedAction, setSelectedAction] = useState<{ record: AdminRecord; action: AdminRecordAction } | null>(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function submitAction() {
    if (!selectedAction || !accessToken) return;
    const field = selectedAction.action.reasonField;
    if (field && reason.trim().length < ADMIN_MOBILE_LIMITS.reasonMinimumLength) { setActionError(ADMIN_MOBILE_ERROR_MESSAGES.actionReasonRequired); return; }
    setIsSaving(true); setActionError('');
    try {
      await requestUleyApi(selectedAction.action.endpoint, { ...selectedAction.action.body, ...(field ? { [field]: reason.trim() } : {}) }, accessToken);
      setSelectedAction(null); setReason(''); await onRefresh();
    } catch (failure) { setActionError(failure instanceof Error ? failure.message : ADMIN_MOBILE_COPY.requestFailed); }
    finally { setIsSaving(false); }
  }

  return <View style={styles.list}>{loading && <Text style={styles.message}>Loading records…</Text>}{error !== '' && <Text style={styles.error}>{error}</Text>}{!loading && !error && records.length === 0 && <Text style={styles.message}>{ADMIN_MOBILE_COPY.empty}</Text>}{records.map((record) => <View key={record.id} style={styles.card}><Text style={styles.title}>{record.title}</Text><Text style={styles.detail}>{record.detail}</Text><Text style={styles.metadata}>{record.metadata}</Text>{record.images?.map((image) => <View key={image.imageUrl} style={styles.imageItem}><Image source={{ uri: image.imageUrl }} accessibilityLabel={image.altText} style={styles.image} /><Text style={styles.metadata}>{image.altText}</Text></View>)}{record.actions?.map((action) => <Pressable key={action.label} onPress={() => { setSelectedAction({ record, action }); setReason(''); setActionError(''); }} style={[styles.button, action.label.toLowerCase().includes('reject') || action.label.toLowerCase().includes('suspend') ? styles.danger : undefined]}><Text style={styles.buttonText}>{action.label}</Text></Pressable>)}</View>)}<Modal visible={selectedAction !== null} transparent animationType="fade" onRequestClose={() => setSelectedAction(null)}><View style={styles.overlay}><View style={styles.dialog}><Text style={styles.title}>{selectedAction?.action.label}</Text><Text style={styles.detail}>{selectedAction?.record.title}</Text>{selectedAction?.action.reasonField && <TextInput value={reason} onChangeText={setReason} placeholder="Reason for this decision" placeholderTextColor={colors.muted} multiline style={styles.reason} maxLength={ADMIN_MOBILE_LIMITS.reasonMaximumLength} />}{actionError !== '' && <Text style={styles.error}>{actionError}</Text>}<Pressable onPress={() => void submitAction()} disabled={isSaving} style={styles.button}><Text style={styles.buttonText}>{isSaving ? 'Saving…' : 'Confirm action'}</Text></Pressable><Pressable onPress={() => setSelectedAction(null)} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable></View></View></Modal></View>;
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  list: { gap: 11, paddingBottom: 24 }, card: { padding: 16, borderWidth: 1, borderColor: colors.line, borderRadius: 15, backgroundColor: colors.surface },
  title: { color: colors.ink, fontSize: 14, fontWeight: '800' }, detail: { marginTop: 7, color: colors.muted, fontSize: 12, lineHeight: 18 }, metadata: { marginTop: 8, color: colors.trust, fontSize: 10, fontWeight: '700' },
  button: { alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.action }, danger: { backgroundColor: colors.errorSurface }, buttonText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  imageItem: { marginTop: 12 }, image: { width: '100%', height: 190, borderRadius: 10, backgroundColor: colors.line },
  message: { paddingVertical: 24, textAlign: 'center', color: colors.muted, fontSize: 12 }, error: { padding: 12, color: colors.error, backgroundColor: colors.errorSurface, borderRadius: 10, fontSize: 11 },
  overlay: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: '#0008' }, dialog: { padding: 18, borderRadius: 16, backgroundColor: colors.surface }, reason: { minHeight: 80, marginTop: 14, padding: 12, textAlignVertical: 'top', borderWidth: 1, borderColor: colors.line, borderRadius: 10, color: colors.ink, fontSize: 12 }, cancel: { padding: 12, alignItems: 'center' }, cancelText: { color: colors.muted, fontWeight: '700', fontSize: 11 },
}); }
