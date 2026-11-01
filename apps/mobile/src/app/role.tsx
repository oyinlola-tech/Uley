import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthPageHeading } from '../components/AuthPageHeading';
import { ScreenFrame } from '../components/ScreenFrame';
import { useMobileTheme } from '../theme';
import { AccountSetupRole } from '../enums';
import { BuildingsIcon, GraduationCapIcon, StorefrontIcon, UserGearIcon } from 'phosphor-react-native';

const accountRoles = [
  { role: AccountSetupRole.STUDENT, icon: GraduationCapIcon, title: 'Student', detail: 'Discover homes, request inspections, and keep your housing search organized.' },
  { role: AccountSetupRole.LANDLORD, icon: BuildingsIcon, title: 'Landlord', detail: 'Verify your details and prepare a property listing for review.' },
  { role: 'business', icon: StorefrontIcon, title: 'Local business', detail: 'Register your business and create paid campaigns for the Uley community.' },
  { role: AccountSetupRole.CARETAKER, icon: UserGearIcon, title: 'Property caretaker', detail: 'Help resolve resident issues after a landlord assigns you to a property.' },
];

export default function RoleSelectionPage() {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  return (
    <ScreenFrame>
      <AuthPageHeading eyebrow="A GOOD PLACE TO BEGIN" title="What brings you to Uley?" description="Choose how you’ll use the platform. You can create the right account in the next step." backPath="/" />
      <View style={styles.content}>
        {accountRoles.map((accountRole) => {
          const RoleIcon = accountRole.icon;
          const isLandlord = accountRole.role === AccountSetupRole.LANDLORD;
          return <Pressable key={accountRole.role} onPress={() => router.push(accountRole.role === 'business' ? '/register-business' : { pathname: '/register', params: { role: accountRole.role } })} style={({ pressed }) => [styles.roleCard, pressed && styles.pressed]}>
          <View style={[styles.roleMark, isLandlord && styles.landlordMark]}><RoleIcon size={25} weight="duotone" color={isLandlord ? colors.trust : colors.primary} /></View>
          <View style={styles.roleCopy}><Text style={styles.roleTitle}>{accountRole.title}</Text><Text style={styles.roleDetail}>{accountRole.detail}</Text></View>
          <Text style={styles.arrow}>→</Text>
        </Pressable>;
        })}
        <View style={styles.note}><Text style={styles.noteTitle}>Independent off-campus homes</Text><Text style={styles.noteCopy}>Uley is not a school-owned hostel system. It helps students find and assess accommodation off campus.</Text></View>
        <Pressable style={styles.browseLink} onPress={() => router.push('/listings')}><Text style={styles.link}>Browse available homes →</Text></Pressable>
        <Pressable style={styles.footerLink} onPress={() => router.push('/login')}><Text style={styles.footerText}>Already have an account? <Text style={styles.link}>Sign in</Text></Text></Pressable>
      </View>
    </ScreenFrame>
  );
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  content: { gap: 13, paddingHorizontal: 24, paddingTop: 8 },
  roleCard: { minHeight: 112, padding: 17, borderWidth: 1, borderColor: colors.line, borderRadius: 18, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 13 },
  roleMark: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.softBlue, alignItems: 'center', justifyContent: 'center' },
  landlordMark: { backgroundColor: colors.paleGreen },
  roleCopy: { flex: 1, gap: 5 },
  roleTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  roleDetail: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  arrow: { color: colors.primary, fontSize: 22, fontWeight: '700' },
  note: { marginTop: 10, padding: 17, borderRadius: 15, backgroundColor: colors.paleGreen, gap: 6 },
  noteTitle: { color: colors.trust, fontSize: 12, fontWeight: '800' },
  noteCopy: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  footerLink: { alignItems: 'center', paddingVertical: 13 },
  browseLink: { alignItems: 'center', paddingVertical: 12 },
  footerText: { color: colors.muted, fontSize: 11 },
  link: { color: colors.primary, fontWeight: '800' },
  pressed: { opacity: 0.8 },
}); }
