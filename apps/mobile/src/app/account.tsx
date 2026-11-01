import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useUleyAuth } from '../auth/AuthProvider';
import { AuthPageHeading } from '../components/AuthPageHeading';
import { ScreenFrame } from '../components/ScreenFrame';
import { useMobileTheme } from '../theme';
import { MOBILE_ERROR_MESSAGES } from '../errors';
import { AccountRole, isAdministratorAccountRole } from '../enums';
import { PushNotificationSettings } from '../components/PushNotificationSettings';

export default function AccountPage() {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const { account, accessToken, isRestoringSession, signOut } = useUleyAuth();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isRestoringSession && !account) router.replace('/login');
  }, [account, isRestoringSession]);

  async function leaveAccount() {
    setErrorMessage('');
    try {
      await signOut();
      router.replace('/');
    } catch {
      setErrorMessage(MOBILE_ERROR_MESSAGES.deviceSessionCleared);
      router.replace('/');
    }
  }

  return (
    <ScreenFrame>
      <AuthPageHeading eyebrow="YOUR ULEY ACCOUNT" title={`Welcome, ${account?.fullName?.split(' ')[0] ?? 'back'}.`} description="Your account keeps your Uley activity connected across your housing journey." backPath="/" />
      <View style={styles.card}>
        <Text style={styles.role}>{account?.userRole ?? 'ACCOUNT'}</Text>
        <Text style={styles.email}>{account?.emailAddress}</Text>
        {account?.userRole && isAdministratorAccountRole(account.userRole) && <Pressable style={styles.actionRow} onPress={() => router.push('/admin')}><Text style={styles.actionLabel}>Open admin workspace</Text><Text style={styles.arrow}>→</Text></Pressable>}
        {(account?.userRole === AccountRole.STUDENT || account?.userRole === AccountRole.LANDLORD || account?.userRole === AccountRole.CARETAKER) && <Pressable style={styles.actionRow} onPress={() => router.push('/my-profile')}><Text style={styles.actionLabel}>Edit my profile</Text><Text style={styles.arrow}>→</Text></Pressable>}
        {account?.userRole === AccountRole.LANDLORD && <Pressable style={styles.actionRow} onPress={() => router.push('/landlord')}><Text style={styles.actionLabel}>Property workspace</Text><Text style={styles.arrow}>→</Text></Pressable>}
        {account?.userRole === AccountRole.LANDLORD && <Pressable style={styles.actionRow} onPress={() => router.push('/landlord-applications' as never)}><Text style={styles.actionLabel}>Rental applications</Text><Text style={styles.arrow}>→</Text></Pressable>}
        {account?.userRole === AccountRole.STUDENT && <Pressable style={styles.actionRow} onPress={() => router.push('/applications' as never)}><Text style={styles.actionLabel}>My rental applications</Text><Text style={styles.arrow}>→</Text></Pressable>}
        {account?.userRole === AccountRole.CARETAKER && <Pressable style={styles.actionRow} onPress={() => router.push('/caretaker-complaints' as never)}><Text style={styles.actionLabel}>Assigned property issues</Text><Text style={styles.arrow}>→</Text></Pressable>}
        {(account?.userRole === AccountRole.STUDENT || account?.userRole === AccountRole.BUSINESS_ADVERTISER) && <Pressable style={styles.actionRow} onPress={() => router.push('/ads')}><Text style={styles.actionLabel}>Ads manager and analytics</Text><Text style={styles.arrow}>→</Text></Pressable>}
        {account?.userRole === AccountRole.STUDENT && <Pressable style={styles.actionRow} onPress={() => router.push('/complaints' as never)}><Text style={styles.actionLabel}>Housing support and complaints</Text><Text style={styles.arrow}>→</Text></Pressable>}
        {accessToken && <PushNotificationSettings accessToken={accessToken} />}
        <Pressable style={styles.actionRow} onPress={() => router.push('/change-password')}><Text style={styles.actionLabel}>Change password</Text><Text style={styles.arrow}>→</Text></Pressable>
        {errorMessage !== '' && <Text style={styles.note}>{errorMessage}</Text>}
        <Pressable style={styles.signOut} onPress={() => void leaveAccount()}><Text style={styles.signOutText}>Sign out</Text></Pressable>
      </View>
    </ScreenFrame>
  );
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  card: { marginHorizontal: 20, padding: 21, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  role: { color: colors.trust, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  email: { marginTop: 8, marginBottom: 22, color: colors.muted, fontSize: 12 },
  actionRow: { minHeight: 55, paddingVertical: 13, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionLabel: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  arrow: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  note: { marginTop: 12, color: colors.muted, fontSize: 11 },
  signOut: { paddingTop: 20, alignItems: 'center' },
  signOutText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
}); }
