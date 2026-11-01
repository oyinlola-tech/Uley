import { StyleSheet } from 'react-native';
import type { useMobileTheme } from '../theme';

export function createLandlordWorkspaceStyles(colors: ReturnType<typeof useMobileTheme>['colors']) {
  return StyleSheet.create({
    inspectionLink: { marginHorizontal: 20, marginBottom: 16, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.paleGreen },
    inspectionLinkText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
    availabilityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
    action: { color: colors.primary, fontSize: 11, fontWeight: '800' },
    panel: { marginHorizontal: 20, marginBottom: 18, padding: 21, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
    label: { color: colors.trust, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
    status: { marginVertical: 13, color: colors.ink, fontSize: 17, fontWeight: '800' },
    heading: { color: colors.ink, fontSize: 20, fontWeight: '800' },
    copy: { marginTop: 8, color: colors.muted, fontSize: 12, lineHeight: 18 },
    reason: { marginBottom: 13, color: colors.error, fontSize: 12 },
    error: { marginHorizontal: 20, marginBottom: 16, color: colors.error },
    notice: { marginHorizontal: 20, marginBottom: 16, color: colors.trust, fontSize: 12 },
    property: { paddingVertical: 14, borderTopWidth: 1, borderColor: colors.line },
    propertyName: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  });
}
