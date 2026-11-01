import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { useMobileTheme } from '../theme';

type LabeledInputProps = TextInputProps & { label: string; helperText?: string; isPassword?: boolean };

export function LabeledInput({ label, helperText, isPassword = false, style, ...inputProps }: LabeledInputProps) {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const shouldHidePassword = isPassword && !isPasswordVisible;
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}><Text style={styles.label}>{label}</Text>{isPassword && <Pressable onPress={() => setIsPasswordVisible((currentlyVisible) => !currentlyVisible)} accessibilityRole="button"><Text style={styles.visibility}>{isPasswordVisible ? 'HIDE' : 'SHOW'}</Text></Pressable>}</View>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        placeholderTextColor={colors.muted}
        secureTextEntry={shouldHidePassword}
        style={[styles.input, style]}
        {...inputProps}
      />
      {helperText && <Text style={styles.helper}>{helperText}</Text>}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  field: { gap: 8, marginTop: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  visibility: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  input: { minHeight: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 13, backgroundColor: colors.surface, color: colors.ink, fontSize: 14 },
  helper: { color: colors.muted, fontSize: 11, lineHeight: 16 },
}); }
