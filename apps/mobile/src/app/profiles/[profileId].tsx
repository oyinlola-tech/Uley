import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChatCircleDotsIcon, GraduationCapIcon, HouseLineIcon, UserCircleIcon } from 'phosphor-react-native';
import { requestUleyApi } from '../../auth/api';
import { useUleyAuth } from '../../auth/AuthProvider';
import { MOBILE_API_ENDPOINTS } from '../../constants';
import { AccountRole, RENTAL_PERIOD_LABELS, RentalPeriod } from '../../enums';
import { AuthPageHeading } from '../../components/AuthPageHeading';
import { ScreenFrame } from '../../components/ScreenFrame';
import { useMobileTheme } from '../../theme';

type MemberProfile = { bio?: string | null; courseOfStudy?: string | null; studyYear?: number | null; interests: string[]; seekingRoommate: boolean; roommateCity?: string | null; roommateNeighborhood?: string | null; roommateBudget?: string | null; roommateRentalPeriod?: RentalPeriod | null; moveInDate?: string | null; user: { id: string; fullName: string; role: AccountRole; university?: { name: string; city: string; state: string } | null } };

export default function PublicProfilePage() {
  const { profileId } = useLocalSearchParams<{ profileId: string }>(); const { colors } = useMobileTheme(); const styles = createStyles(colors); const { accessToken, account } = useUleyAuth();
  const [profile, setProfile] = useState<MemberProfile | null>(null); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  useEffect(() => { if (!accessToken || !profileId) return; void requestUleyApi<{ profile: MemberProfile }>(`${MOBILE_API_ENDPOINTS.profiles}/${profileId}`, undefined, accessToken).then((result) => setProfile(result.profile)).catch((failure) => setError(failure instanceof Error ? failure.message : 'This profile is unavailable.')); }, [accessToken, profileId]);
  async function messageProfile() { if (!accessToken || !profile) return; try { const result = await requestUleyApi<{ conversation: { id: string } }>(`${MOBILE_API_ENDPOINTS.profiles}/${profile.user.id}${MOBILE_API_ENDPOINTS.profileContact}`, {}, accessToken); router.push({ pathname: '/messages', params: { conversationId: result.conversation.id } }); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to start this conversation.'); } }
  async function blockProfile() { if (!accessToken || !profile) return; try { await requestUleyApi(`${MOBILE_API_ENDPOINTS.userBlocks}/${profile.user.id}${MOBILE_API_ENDPOINTS.userBlockAction}`, {}, accessToken); setNotice('This person is blocked. You can manage blocks from your messages.'); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to block this person.'); } }
  const isOwnProfile = profile?.user.id === account?.id;
  return <ScreenFrame><AuthPageHeading eyebrow="ULEY MEMBER PROFILE" title={profile?.user.fullName ?? (error ? 'Profile unavailable.' : 'Loading profile…')} description={profile ? `${profile.user.role.toLowerCase()}${profile.user.university ? ` · ${profile.user.university.name}` : ''}` : 'Profiles are visible to signed-in students.'} backPath="/flatmates" />
    {profile && <View style={styles.page}><View style={styles.avatar}>{profile.user.role === AccountRole.STUDENT ? <GraduationCapIcon size={32} color={colors.primary} weight="duotone" /> : <HouseLineIcon size={32} color={colors.trust} weight="duotone" />}</View>
      <View style={styles.card}><Text style={styles.sectionTitle}>A little about {profile.user.fullName.split(' ')[0]}</Text><Text style={styles.body}>{profile.bio || 'This member has not added an introduction yet.'}</Text>{profile.user.university && <Text style={styles.meta}>{profile.user.university.city}, {profile.user.university.state}</Text>}
        {!!profile.courseOfStudy && <View style={styles.metaRow}><GraduationCapIcon size={15} color={colors.muted} /><Text style={styles.meta}>{profile.courseOfStudy}{profile.studyYear ? ` · Year ${profile.studyYear}` : ''}</Text></View>}
        {profile.interests.length > 0 && <View style={styles.tags}>{profile.interests.map((interest) => <Text key={interest} style={styles.tag}>{interest}</Text>)}</View>}
      </View>
      {profile.seekingRoommate && <View style={styles.card}><Text style={styles.sectionTitle}>Roommate search</Text><View style={styles.metaRow}><HouseLineIcon size={15} color={colors.trust} /><Text style={styles.meta}>{profile.roommateCity}{profile.roommateNeighborhood ? ` · ${profile.roommateNeighborhood}` : ''}</Text></View>{profile.roommateBudget && <Text style={styles.body}>Budget up to ₦{Number(profile.roommateBudget).toLocaleString()} / {RENTAL_PERIOD_LABELS[profile.roommateRentalPeriod ?? RentalPeriod.YEAR].toLowerCase()}</Text>}{profile.moveInDate && <Text style={styles.meta}>Move-in around {new Date(profile.moveInDate).toLocaleDateString()}</Text>}</View>}
      {!!error && <Text style={styles.error}>{error}</Text>}{!!notice && <Text style={styles.notice}>{notice}</Text>}
      {!isOwnProfile && <View style={styles.actions}><Pressable style={styles.messageButton} onPress={() => void messageProfile()}><ChatCircleDotsIcon size={18} color="#fff" /><Text style={styles.messageText}>Message on Uley</Text></Pressable><Pressable style={styles.blockButton} onPress={() => void blockProfile()}><UserCircleIcon size={16} color={colors.muted} /><Text style={styles.blockText}>Block</Text></Pressable></View>}
    </View>}
  </ScreenFrame>;
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({ page: { gap: 14, marginHorizontal: 20, marginBottom: 24 }, avatar: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: colors.softBlue }, card: { gap: 10, padding: 17, borderWidth: 1, borderColor: colors.line, borderRadius: 15, backgroundColor: colors.surface }, sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' }, body: { color: colors.muted, fontSize: 12, lineHeight: 18 }, metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, meta: { color: colors.muted, fontSize: 10 }, tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.softBlue, color: colors.primary, fontSize: 9, fontWeight: '700' }, actions: { gap: 10 }, messageButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, backgroundColor: colors.action }, messageText: { color: '#fff', fontSize: 12, fontWeight: '800' }, blockButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, blockText: { color: colors.muted, fontSize: 10 }, error: { color: colors.error, fontSize: 11 }, notice: { color: colors.trust, fontSize: 11 } }); }
