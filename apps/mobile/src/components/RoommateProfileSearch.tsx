import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { requestUleyApi } from '../auth/api';
import { MOBILE_API_ENDPOINTS } from '../constants';
import { AccountRole, RentalPeriod, RENTAL_PERIOD_LABELS } from '../enums';
import { LabeledInput } from './LabeledInput';
import { useMobileTheme } from '../theme';

type RoommateProfile = { id: string; fullName: string; role: AccountRole; university?: { name: string } | null; profile: { bio?: string | null; roommateCity?: string | null; roommateNeighborhood?: string | null; roommateBudget?: string | null; roommateRentalPeriod?: RentalPeriod | null } };

export function RoommateProfileSearch({ accessToken, role, onError }: { accessToken: string | null; role?: AccountRole; onError: (message: string) => void }) {
  const { colors } = useMobileTheme(); const styles = createStyles(colors);
  const [profiles, setProfiles] = useState<RoommateProfile[]>([]); const [city, setCity] = useState(''); const [maximumBudget, setMaximumBudget] = useState('');
  async function search() {
    if (!accessToken) return;
    try {
      const query = new URLSearchParams(); if (city.trim()) query.set('city', city.trim()); if (maximumBudget) query.set('maximumBudget', maximumBudget);
      const result = await requestUleyApi<{ profiles: RoommateProfile[] }>(`${MOBILE_API_ENDPOINTS.profiles}?${query.toString()}`, undefined, accessToken);
      setProfiles(result.profiles);
    } catch (failure) { onError(failure instanceof Error ? failure.message : 'Unable to search roommate profiles.'); }
  }
  useEffect(() => { if (role === AccountRole.STUDENT) void search(); }, [accessToken, role]);
  if (role !== AccountRole.STUDENT) return null;
  return <View style={styles.panel}><Text style={styles.title}>Roommate profiles</Text><Text style={styles.copy}>Browse students who have chosen to look for a roommate.</Text><View style={styles.filters}><LabeledInput label="City" value={city} onChangeText={setCity}/><LabeledInput label="Maximum budget (₦)" value={maximumBudget} onChangeText={setMaximumBudget} keyboardType="numeric"/></View><Pressable style={styles.search} onPress={() => void search()}><Text style={styles.searchText}>Search profiles</Text></Pressable>{profiles.length ? profiles.map((member) => <View key={member.id} style={styles.profile}><Text style={styles.name}>{member.fullName}</Text><Text style={styles.meta}>{member.profile.roommateCity}{member.profile.roommateNeighborhood ? ` · ${member.profile.roommateNeighborhood}` : ''}{member.profile.roommateBudget ? ` · up to ₦${Number(member.profile.roommateBudget).toLocaleString()} / ${RENTAL_PERIOD_LABELS[member.profile.roommateRentalPeriod ?? RentalPeriod.YEAR].toLowerCase()}` : ''}</Text>{member.university && <Text style={styles.copy}>{member.university.name}</Text>}{member.profile.bio && <Text numberOfLines={2} style={styles.copy}>{member.profile.bio}</Text>}<Pressable onPress={() => router.push({ pathname: '/profiles/[profileId]', params: { profileId: member.id } })}><Text style={styles.link}>View profile and message →</Text></Pressable></View>) : <Text style={styles.copy}>No roommate profiles match yet. Try another city or budget.</Text>}</View>;
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({ panel: { marginHorizontal: 20, marginBottom: 18, padding: 18, borderWidth: 1, borderColor: colors.line, borderRadius: 16, backgroundColor: colors.surface }, title: { marginBottom: 7, color: colors.ink, fontSize: 17, fontWeight: '800' }, copy: { marginTop: 5, color: colors.muted, fontSize: 11, lineHeight: 16 }, filters: { gap: 5 }, search: { minHeight: 42, marginTop: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.action }, searchText: { color: '#fff', fontSize: 11, fontWeight: '800' }, profile: { paddingVertical: 13, borderTopWidth: 1, borderColor: colors.line }, name: { color: colors.ink, fontSize: 14, fontWeight: '800' }, meta: { marginTop: 4, color: colors.trust, fontSize: 10, fontWeight: '700' }, link: { marginTop: 9, color: colors.primary, fontSize: 11, fontWeight: '800' } }); }
