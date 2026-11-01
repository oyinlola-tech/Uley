import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useMobileTheme } from '../theme';

type AuthPageHeadingProps = { eyebrow: string; title: string; description: string; backPath?: Href };

export function AuthPageHeading({ eyebrow, title, description, backPath }: AuthPageHeadingProps) {
  const { colors } = useMobileTheme();
  return (
    <View style={styles.container}>
      {backPath && <Pressable accessibilityRole="button" onPress={() => router.replace(backPath)} style={styles.backButton}><Text style={[styles.back, { color: colors.primary }]}>←  Back</Text></Pressable>}
      <Text style={[styles.eyebrow, { color: colors.trust }]}>●  {eyebrow}</Text>
      <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.muted }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 18 },
  backButton: { alignSelf: 'flex-start', marginBottom: 18, paddingVertical: 5 },
  back: { fontSize: 12, fontWeight: '700' },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  title: { marginTop: 13, fontSize: 32, fontWeight: '800', letterSpacing: -1.3, lineHeight: 38 },
  description: { marginTop: 10, fontSize: 13, lineHeight: 20 },
});
