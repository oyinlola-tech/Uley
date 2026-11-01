import { useEffect, useState } from 'react';
import { Pressable, Switch, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { requestUleyApi } from '../auth/api';
import { useUleyAuth } from '../auth/AuthProvider';
import { MOBILE_API_ENDPOINTS } from '../constants';
import { AccountRole, RentalPeriod, RENTAL_PERIOD_LABELS } from '../enums';
import { AuthPageHeading } from '../components/AuthPageHeading';
import { LabeledInput } from '../components/LabeledInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenFrame } from '../components/ScreenFrame';
import { useMobileTheme } from '../theme';

type Profile = { bio?: string | null; courseOfStudy?: string | null; studyYear?: number | null; interests: string[]; isDiscoverable: boolean; seekingRoommate: boolean; roommateCity?: string | null; roommateNeighborhood?: string | null; roommateBudget?: string | null; roommateRentalPeriod?: RentalPeriod | null; moveInDate?: string | null };
type ProfileResponse = { profile: Profile & { user: { fullName: string; role: AccountRole; university?: { name: string } | null } } };

export default function MyProfilePage() {
  const { colors } = useMobileTheme(); const styles = createStyles(colors); const { accessToken, account } = useUleyAuth();
  const [profile, setProfile] = useState<Profile | null>(null); const [interests, setInterests] = useState(''); const [studyYear, setStudyYear] = useState(''); const [moveInDate, setMoveInDate] = useState(''); const [isLoading, setIsLoading] = useState(true); const [isSaving, setIsSaving] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');

  useEffect(() => { if (!accessToken) { setIsLoading(false); return; } void requestUleyApi<ProfileResponse>(MOBILE_API_ENDPOINTS.profiles + '/me', undefined, accessToken).then(({ profile: value }) => { setProfile(value); setInterests(value.interests.join(', ')); setStudyYear(value.studyYear?.toString() ?? ''); setMoveInDate(value.moveInDate?.slice(0, 10) ?? ''); }).catch((failure) => setError(failure instanceof Error ? failure.message : 'Unable to load your profile.')).finally(() => setIsLoading(false)); }, [accessToken]);
  function updateProfileField<Key extends keyof Profile>(key: Key, value: Profile[Key]) { setProfile((current) => current ? { ...current, [key]: value } : current); }
  async function saveProfile() {
    if (!accessToken || !profile) return;
    setIsSaving(true); setError(''); setNotice('');
    try {
      const payload = { bio: profile.bio ?? '', courseOfStudy: profile.courseOfStudy ?? '', studyYear: studyYear ? Number(studyYear) : null, interests: interests.split(',').map((item) => item.trim()).filter(Boolean), isDiscoverable: profile.isDiscoverable, seekingRoommate: profile.seekingRoommate, roommateCity: profile.roommateCity ?? '', roommateNeighborhood: profile.roommateNeighborhood ?? '', roommateBudget: profile.roommateBudget ? Number(profile.roommateBudget) : null, roommateRentalPeriod: profile.roommateRentalPeriod ?? null, moveInDate: moveInDate ? new Date(`${moveInDate}T12:00:00`).toISOString() : null };
      const result = await requestUleyApi<ProfileResponse>(MOBILE_API_ENDPOINTS.profiles + '/me', payload, accessToken);
      setProfile(result.profile); setNotice('Your profile is saved and visible to signed-in students.');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to save your profile.'); }
    finally { setIsSaving(false); }
  }
  if (isLoading || !profile) return <ScreenFrame><AuthPageHeading eyebrow="YOUR ULEY PROFILE" title="Make your profile yours." description={isLoading ? 'Loading your profile…' : 'Sign in to manage your profile.'} backPath="/account" /></ScreenFrame>;
  const isStudent = account?.userRole === AccountRole.STUDENT;
  return <ScreenFrame><AuthPageHeading eyebrow="YOUR ULEY PROFILE" title="Make your profile yours." description="Signed-in students can see your profile. Your email and phone number are never shown here." backPath="/account" />
    <View style={styles.form}><Text style={styles.identity}>{account?.fullName ?? 'Your profile'}</Text><Text style={styles.school}>A profile helps people understand who they are talking with.</Text>
      <View style={styles.toggle}><View style={styles.toggleCopy}><Text style={styles.label}>Visible to signed-in students</Text><Text style={styles.hint}>You can hide your profile at any time.</Text></View><Switch value={profile.isDiscoverable} onValueChange={(value) => updateProfileField('isDiscoverable', value)} trackColor={{ true: colors.trust }} /></View>
      <LabeledInput label="About you" value={profile.bio ?? ''} onChangeText={(value) => updateProfileField('bio', value)} multiline numberOfLines={4} />
      {isStudent && <><LabeledInput label="Course or programme" value={profile.courseOfStudy ?? ''} onChangeText={(value) => updateProfileField('courseOfStudy', value)} /><LabeledInput label="Year of study (1–8)" value={studyYear} onChangeText={setStudyYear} keyboardType="number-pad" /><LabeledInput label="Interests (separate with commas)" value={interests} onChangeText={setInterests} />
        <View style={styles.toggle}><View style={styles.toggleCopy}><Text style={styles.label}>Looking for a roommate</Text><Text style={styles.hint}>Your preferences help students find a compatible search.</Text></View><Switch value={profile.seekingRoommate} onValueChange={(value) => updateProfileField('seekingRoommate', value)} trackColor={{ true: colors.trust }} /></View>
        {profile.seekingRoommate && <><LabeledInput label="Roommate search city" value={profile.roommateCity ?? ''} onChangeText={(value) => updateProfileField('roommateCity', value)} /><LabeledInput label="Neighborhood (optional)" value={profile.roommateNeighborhood ?? ''} onChangeText={(value) => updateProfileField('roommateNeighborhood', value)} /><LabeledInput label="Maximum rent budget (₦)" value={profile.roommateBudget ?? ''} onChangeText={(value) => updateProfileField('roommateBudget', value)} keyboardType="numeric" /><Text style={styles.label}>Rent period</Text><Picker selectedValue={profile.roommateRentalPeriod ?? RentalPeriod.YEAR} onValueChange={(value: RentalPeriod) => updateProfileField('roommateRentalPeriod', value)}>{Object.values(RentalPeriod).map((period) => <Picker.Item key={period} value={period} label={RENTAL_PERIOD_LABELS[period]} />)}</Picker><LabeledInput label="Move-in date (YYYY-MM-DD, optional)" value={moveInDate} onChangeText={setMoveInDate} /></>}
      </>}
      {!!error && <Text style={styles.error}>{error}</Text>}{!!notice && <Text style={styles.notice}>{notice}</Text>}<PrimaryButton label={isSaving ? 'Saving profile…' : 'Save profile'} onPress={() => void saveProfile()} disabled={isSaving} loading={isSaving} />
    </View>
  </ScreenFrame>;
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({ form: { gap: 14, marginHorizontal: 20, marginBottom: 24, padding: 18, borderWidth: 1, borderColor: colors.line, borderRadius: 16, backgroundColor: colors.surface }, identity: { color: colors.ink, fontSize: 20, fontWeight: '800' }, school: { marginTop: -7, color: colors.muted, fontSize: 11, lineHeight: 16 }, toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderColor: colors.line }, toggleCopy: { flex: 1, gap: 4 }, label: { color: colors.ink, fontSize: 11, fontWeight: '800' }, hint: { color: colors.muted, fontSize: 10, lineHeight: 15 }, error: { color: colors.error, fontSize: 11 }, notice: { color: colors.trust, fontSize: 11 } }); }
