import { MoonIcon, SunIcon } from 'phosphor-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { useMobileTheme } from '../theme';

export function ThemeToggle({ appearance = 'default' }: { appearance?: 'default' | 'chrome' }) {
  const { colors, isDark, toggleTheme } = useMobileTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`} onPress={toggleTheme} style={[styles.button, appearance === 'chrome' ? styles.chromeButton : { backgroundColor: colors.surface, borderColor: colors.line }]}>
      {isDark ? <SunIcon color={colors.citrus} size={18} /> : <MoonIcon color={colors.ink} size={18} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 12 },
  chromeButton: { borderColor: 'transparent', backgroundColor: 'transparent' },
});
