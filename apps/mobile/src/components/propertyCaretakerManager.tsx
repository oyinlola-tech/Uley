import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { requestUleyApi } from '../auth/api';
import { useUleyAuth } from '../auth/AuthProvider';
import { MOBILE_API_ENDPOINTS, MOBILE_PROPERTY_CARETAKER_COPY } from '../constants';
import { MOBILE_ERROR_MESSAGES } from '../errors';
import { useMobileTheme } from '../theme';

type Caretaker = { assignedAt: string; caretaker: { id: string; fullName: string; email: string } };
export function PropertyCaretakerManager({ propertyId }: { propertyId: string }) {
  const { accessToken } = useUleyAuth();
  const { colors } = useMobileTheme();
  const [assigned, setAssigned] = useState<Caretaker[]>([]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const endpoint = `${MOBILE_API_ENDPOINTS.landlordProperties}/${propertyId}${MOBILE_API_ENDPOINTS.landlordPropertyCaretakers}`;
  const refresh = useCallback(async () => {
    if (!accessToken) return;
    try { const result = await requestUleyApi<{ caretakers: Caretaker[] }>(endpoint, undefined, accessToken); setAssigned(result.caretakers); }
    catch (error) { setMessage(error instanceof Error ? error.message : MOBILE_ERROR_MESSAGES.caretakerListUnavailable); }
  }, [accessToken, endpoint]);
  useEffect(() => { if (isOpen) void refresh(); }, [isOpen, refresh]);
  async function assign() {
    if (!accessToken || !email.includes('@')) return;
    setBusy(true); setMessage('');
    try { await requestUleyApi(endpoint, { emailAddress: email.trim() }, accessToken); setEmail(''); setMessage(MOBILE_PROPERTY_CARETAKER_COPY.assigned); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : MOBILE_ERROR_MESSAGES.caretakerAssignFailed); }
    finally { setBusy(false); }
  }
  async function remove(caretaker: Caretaker) {
    if (!accessToken) return;
    setBusy(true);
    try { await requestUleyApi(`${endpoint}/${caretaker.caretaker.id}`, undefined, accessToken, 'DELETE'); setMessage(MOBILE_PROPERTY_CARETAKER_COPY.removed); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : MOBILE_ERROR_MESSAGES.caretakerRemoveFailed); }
    finally { setBusy(false); }
  }
  return <View style={{ marginTop: 10, padding: 13, gap: 8, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface }}>
    <Text style={{ color: colors.ink, fontWeight: '800', fontSize: 13 }}>{MOBILE_PROPERTY_CARETAKER_COPY.heading}</Text>
    <Text style={{ color: colors.muted, fontSize: 11 }}>{MOBILE_PROPERTY_CARETAKER_COPY.access}</Text>
    <Pressable onPress={() => setIsOpen((open) => !open)} accessibilityState={{ expanded: isOpen }}><Text style={{ color: colors.primary, fontWeight: '800' }}>{isOpen ? 'Hide caretakers' : 'Manage caretakers'}</Text></Pressable>
    {isOpen && <>
    {assigned.map((item) => <View key={item.caretaker.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}><Text style={{ flex: 1, color: colors.ink, fontSize: 11 }}>{item.caretaker.fullName} · {item.caretaker.email}</Text><Pressable disabled={busy} onPress={() => void remove(item)}><Text style={{ color: colors.error, fontWeight: '700' }}>{MOBILE_PROPERTY_CARETAKER_COPY.remove}</Text></Pressable></View>)}
    <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder={MOBILE_PROPERTY_CARETAKER_COPY.emailPlaceholder} placeholderTextColor={colors.muted} style={{ padding: 10, color: colors.ink, borderWidth: 1, borderColor: colors.line, borderRadius: 8 }} />
    <Pressable disabled={busy || !email.includes('@')} onPress={() => void assign()}><Text style={{ color: colors.primary, fontWeight: '800' }}>{busy ? MOBILE_PROPERTY_CARETAKER_COPY.assigning : MOBILE_PROPERTY_CARETAKER_COPY.assign}</Text></Pressable>
    {!!message && <Text accessibilityRole="text" style={{ color: colors.muted, fontSize: 10 }}>{message}</Text>}
    </>}
  </View>;
}
