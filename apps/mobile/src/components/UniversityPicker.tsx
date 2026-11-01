import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CheckIcon, MagnifyingGlassIcon, MapPinIcon } from 'phosphor-react-native';
import { MOBILE_UNLISTED_UNIVERSITY_COPY, MOBILE_UNLISTED_UNIVERSITY_VALUE } from '../constants';
import { useMobileTheme } from '../theme';

type University = { id: string; name: string; city: string; state: string };

export function UniversityPicker({ universities, value, onChange, isLoading = false }: { universities: University[]; value: string; onChange: (id: string) => void; isLoading?: boolean }) {
  const { colors } = useMobileTheme(); const styles = createStyles(colors); const [search, setSearch] = useState('');
  const matches = useMemo(() => universities.filter((item) => `${item.name} ${item.city} ${item.state}`.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8), [universities, search]);
  const selected = universities.find((item) => item.id === value);
  return <View style={styles.section}>
    <Text style={styles.heading}>Which university are you connected to?</Text>
    <Text style={styles.description}>Search Nigerian public universities by name, city, or state.</Text>
    {!!selected && <View style={styles.selected}><CheckIcon size={18} color={colors.trust} weight="bold"/><View style={styles.selectedText}><Text style={styles.selectedName}>{selected.name}</Text><Text style={styles.detail}>{selected.city}, {selected.state}</Text></View><Pressable accessibilityRole="button" onPress={() => onChange('')}><Text style={styles.change}>Change</Text></Pressable></View>}
    <View style={styles.searchBox}><MagnifyingGlassIcon size={18} color={colors.muted}/><TextInput accessibilityLabel="Search public universities" placeholder={MOBILE_UNLISTED_UNIVERSITY_COPY.searchPlaceholder} placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} style={styles.searchInput}/></View>
    <View accessibilityRole="radiogroup" accessibilityLabel="University results">{matches.map((university) => <Pressable key={university.id} accessibilityRole="radio" accessibilityState={{ checked: value === university.id }} onPress={() => onChange(university.id)} style={[styles.result, value === university.id && styles.resultSelected]}><View style={styles.resultIcon}><MapPinIcon size={17} color={colors.primary}/></View><View style={styles.resultText}><Text style={styles.resultName}>{university.name}</Text><Text style={styles.detail}>{university.city}, {university.state}</Text></View>{value === university.id && <CheckIcon size={18} color={colors.trust} weight="bold"/>}</Pressable>)}</View>
    {isLoading && <Text style={styles.empty}>Loading public universities…</Text>}
    {search.trim() !== '' && matches.length === 0 && <Text style={styles.empty}>{MOBILE_UNLISTED_UNIVERSITY_COPY.noMatches}</Text>}
    <Pressable accessibilityRole="button" accessibilityState={{ selected: value === MOBILE_UNLISTED_UNIVERSITY_VALUE }} onPress={() => onChange(value === MOBILE_UNLISTED_UNIVERSITY_VALUE ? '' : MOBILE_UNLISTED_UNIVERSITY_VALUE)} style={styles.unlisted}><Text style={styles.unlistedTitle}>{MOBILE_UNLISTED_UNIVERSITY_COPY.option} →</Text><Text style={styles.detail}>Add your school name and campus location to continue.</Text></Pressable>
  </View>;
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({ section: { marginTop: 20, gap: 10 }, heading: { color: colors.ink, fontSize: 14, fontWeight: '800' }, description: { color: colors.muted, fontSize: 11, lineHeight: 16 }, searchBox: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.paper }, searchInput: { flex: 1, minHeight: 46, color: colors.ink, fontSize: 13 }, result: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: colors.line }, resultSelected: { borderColor: colors.trust, backgroundColor: colors.softBlue }, resultIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.surface }, resultText: { flex: 1, gap: 3 }, resultName: { color: colors.ink, fontSize: 12, fontWeight: '700' }, detail: { color: colors.muted, fontSize: 10 }, selected: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 11, backgroundColor: colors.softBlue }, selectedText: { flex: 1, gap: 3 }, selectedName: { color: colors.ink, fontSize: 12, fontWeight: '800' }, change: { color: colors.primary, fontSize: 10, fontWeight: '800' }, empty: { paddingVertical: 8, color: colors.muted, fontSize: 11 }, unlisted: { gap: 5, marginTop: 3, padding: 13, borderWidth: 1, borderColor: colors.line, borderStyle: 'dashed', borderRadius: 11 }, unlistedTitle: { color: colors.primary, fontSize: 12, fontWeight: '800' } }); }
