import Svg, { Path, Rect } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';
import { ULEY_COLORS } from '../constants/brand';
import { useMobileTheme } from '../theme';

export function UleyWordmark() {
  const { colors } = useMobileTheme();
  return (
    <View style={styles.row} accessibilityLabel="Uley">
      <View style={styles.mark}>
        <Svg width={24} height={24} viewBox="0 0 24 24">
          <Path d="M3.5 10 12 3l8.5 7" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M6 9v11h12V9" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinejoin="round" />
          <Path d="M10 20v-6a2 2 0 0 1 4 0v6" fill="none" stroke={ULEY_COLORS.citrus} strokeWidth={2} strokeLinecap="round" />
          <Rect x={17} y={5} width={2.5} height={2.5} rx={1.25} fill={ULEY_COLORS.citrus} />
        </Svg>
      </View>
      <Text style={[styles.wordmark, { color: colors.ink }]}>uley<Text style={[styles.period, { color: colors.primary }]}>.</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mark: { width: 38, height: 38, borderRadius: 12, backgroundColor: ULEY_COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 23, fontWeight: '800', letterSpacing: -1.2 },
  period: {},
});
