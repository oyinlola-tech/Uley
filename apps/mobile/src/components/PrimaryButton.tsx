import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight } from 'phosphor-react-native';
import { useMobileTheme } from '../theme';

type PrimaryButtonProps = { label: string; onPress: () => void; disabled?: boolean; loading?: boolean; light?: boolean };

export function PrimaryButton({ label, onPress, disabled = false, loading = false, light = false }: PrimaryButtonProps) {
  const { colors } = useMobileTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: light ? colors.citrus : colors.action }, pressed && styles.pressed, (disabled || loading) && styles.disabled]}
    >
      <Text style={[styles.label, light && { color: colors.ink }]}>{loading ? 'Please wait…' : label}</Text>
      <View style={[styles.arrowTile, light && styles.lightArrowTile]}>{loading ? <ActivityIndicator color={light ? colors.action : '#fff'} size="small" /> : <ArrowRight color={light ? colors.ink : '#fff'} size={20} weight="bold" />}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 56, padding: 7, paddingLeft: 18, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: '#fff', fontSize: 13, fontWeight: '700' },
  arrowTile: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#ffffff2b', alignItems: 'center', justifyContent: 'center' },
  lightArrowTile: { backgroundColor: '#17243b18' },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
});
