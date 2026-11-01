import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { requestUleyApi } from '../../auth/api';
import { useUleyAuth } from '../../auth/AuthProvider';
import { AdminRecordList } from '../../components/adminRecordList';
import { AdminShell } from '../../components/adminShell';
import { MOBILE_API_ENDPOINTS, ADMIN_MOBILE_STAFF_ROLES, ADMIN_MOBILE_STAFF_ROLE_LABELS, ADMIN_MOBILE_LIMITS } from '../../constants';
import type { AdminAccountFeed } from '../../models';
import { useAdminResource } from '../../hooks/useAdminResource';
import { useMobileTheme } from '../../theme';
import { ADMIN_MOBILE_ERROR_MESSAGES } from '../../errors';
import { mapAccountRecords } from '../../utils/adminRecordMapper';

export default function AdminStaffPage() {
  const { data, error, isLoading, reload } = useAdminResource<{ staff: AdminAccountFeed[] }>(MOBILE_API_ENDPOINTS.adminStaff);
  const { accessToken } = useUleyAuth();
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<(typeof ADMIN_MOBILE_STAFF_ROLES)[number]>(ADMIN_MOBILE_STAFF_ROLES[0]);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function createStaff() {
    if (!accessToken) return;
    setIsSaving(true); setFormError(''); setNotice('');
    try {
      await requestUleyApi(MOBILE_API_ENDPOINTS.adminStaff, { fullName: fullName.trim(), email: email.trim(), password, role }, accessToken);
      setFullName(''); setEmail(''); setPassword(''); setNotice('Administrator account created. Share the temporary password securely.'); await reload();
    } catch (failure) { setFormError(failure instanceof Error ? failure.message : ADMIN_MOBILE_ERROR_MESSAGES.staffCreationFailed); }
    finally { setIsSaving(false); }
  }

  return <AdminShell title="Administrator access" activeRoute="/admin/staff"><View style={styles.form}><Text style={styles.formHeading}>Add a staff account</Text><Text style={styles.description}>Use a unique temporary password of at least 16 characters.</Text><TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full name" placeholderTextColor={colors.muted} autoComplete="name" maxLength={160} /><TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" autoComplete="email" maxLength={320} /><Text style={styles.roleLabel}>Choose role</Text><View style={styles.roles}>{ADMIN_MOBILE_STAFF_ROLES.map((item) => <Pressable key={item} onPress={() => setRole(item)} style={[styles.roleButton, role === item && styles.roleButtonActive]}><Text style={[styles.roleText, role === item && styles.roleTextActive]}>{ADMIN_MOBILE_STAFF_ROLE_LABELS[item]}</Text></Pressable>)}</View><TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Temporary password · 16 characters minimum" placeholderTextColor={colors.muted} secureTextEntry autoComplete="new-password" maxLength={ADMIN_MOBILE_LIMITS.staffPasswordMaximumLength} /><Pressable onPress={() => void createStaff()} disabled={isSaving || fullName.trim().length < 2 || password.length < ADMIN_MOBILE_LIMITS.staffPasswordMinimumLength} style={[styles.submit, (isSaving || fullName.trim().length < 2 || password.length < ADMIN_MOBILE_LIMITS.staffPasswordMinimumLength) && styles.disabled]}><Text style={styles.submitText}>{isSaving ? 'Creating…' : 'Create administrator'}</Text></Pressable>{formError !== '' && <Text style={styles.error}>{formError}</Text>}{notice !== '' && <Text style={styles.notice}>{notice}</Text>}</View><Text style={styles.sectionHeading}>Current administrator accounts</Text><AdminRecordList records={data ? mapAccountRecords(data.staff, true) : []} loading={isLoading} error={error} onRefresh={reload} /></AdminShell>;
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  form: { marginBottom: 22, padding: 16, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }, formHeading: { color: colors.ink, fontSize: 14, fontWeight: '800' }, description: { marginTop: 5, marginBottom: 12, color: colors.muted, fontSize: 10, lineHeight: 15 }, input: { minHeight: 45, marginTop: 9, paddingHorizontal: 12, borderRadius: 9, borderWidth: 1, borderColor: colors.line, color: colors.ink, fontSize: 11 }, roleLabel: { marginTop: 12, color: colors.muted, fontSize: 10, fontWeight: '700' }, roles: { gap: 6, marginTop: 7 }, roleButton: { padding: 8, borderRadius: 8, backgroundColor: colors.paper }, roleButtonActive: { backgroundColor: colors.softBlue }, roleText: { color: colors.muted, fontSize: 10, fontWeight: '700' }, roleTextActive: { color: colors.primary }, submit: { marginTop: 12, padding: 13, alignItems: 'center', borderRadius: 9, backgroundColor: colors.action }, submitText: { color: '#FFF', fontSize: 11, fontWeight: '800' }, disabled: { opacity: 0.45 }, error: { marginTop: 9, color: colors.error, fontSize: 10 }, notice: { marginTop: 9, color: colors.trust, fontSize: 10 }, sectionHeading: { marginBottom: 10, color: colors.ink, fontSize: 15, fontWeight: '800' },
}); }
