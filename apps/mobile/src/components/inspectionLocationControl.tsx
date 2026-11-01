import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { MOBILE_API_BASE_URL, MOBILE_API_ENDPOINTS, INSPECTION_LOCATION_COPY, INSPECTION_LOCATION_POLL_INTERVAL_MS, INSPECTION_LOCATION_UPDATE_INTERVAL_MS } from '../constants';
import { AccountRole, InspectionStatus } from '../enums';
import { MOBILE_ERROR_MESSAGES } from '../errors';
import { useMobileTheme } from '../theme';

type SharedLocation = { latitude: number; longitude: number; updatedAt: string } | null;
type Props = { inspectionId: string; status: InspectionStatus; role: AccountRole; accessToken: string };

export function InspectionLocationControl({ inspectionId, status, role, accessToken }: Props) {
  const { colors } = useMobileTheme();
  const styles = createStyles(colors);
  const [sharing, setSharing] = useState(false);
  const [sharedLocation, setSharedLocation] = useState<SharedLocation>(null);
  const [error, setError] = useState('');
  const isStudent = role === AccountRole.STUDENT;
  const enabled = status === InspectionStatus.CONFIRMED;
  const locationEndpoint = `${MOBILE_API_ENDPOINTS.inspections}/${inspectionId}${MOBILE_API_ENDPOINTS.inspectionLocationAction}`;
  const shareEndpoint = `${MOBILE_API_ENDPOINTS.inspections}/${inspectionId}${MOBILE_API_ENDPOINTS.inspectionLocationShareAction}`;

  const getSharedLocation = useCallback(async () => {
    const result = await sendRequest<{ sharing: boolean; location: SharedLocation }>(locationEndpoint, 'GET', undefined, accessToken);
    setSharing(result.sharing);
    setSharedLocation(result.location);
  }, [accessToken, locationEndpoint]);

  useEffect(() => {
    if (!enabled) return;
    void getSharedLocation().catch(() => undefined);
    if (isStudent) return;
    const interval = setInterval(() => { void getSharedLocation().catch(() => undefined); }, INSPECTION_LOCATION_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, getSharedLocation, isStudent]);

  useEffect(() => {
    if (!enabled || !isStudent || !sharing) return;
    let subscription: Location.LocationSubscription | undefined;
    void Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: INSPECTION_LOCATION_UPDATE_INTERVAL_MS, distanceInterval: 10 }, (position) => {
      void sendRequest(locationEndpoint, 'PUT', { latitude: position.coords.latitude, longitude: position.coords.longitude }, accessToken)
        .then(() => setSharedLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, updatedAt: new Date().toISOString() }))
        .catch(() => setError(MOBILE_ERROR_MESSAGES.inspectionLocationUnavailable));
    }).then((watcher) => { subscription = watcher; }).catch(() => setError(MOBILE_ERROR_MESSAGES.locationPermissionDenied));
    return () => subscription?.remove();
  }, [accessToken, enabled, isStudent, locationEndpoint, sharing]);

  async function toggleSharing() {
    setError('');
    try {
      if (sharing) {
        await sendRequest(shareEndpoint, 'DELETE', undefined, accessToken);
        setSharing(false);
        setSharedLocation(null);
        return;
      }
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) { setError(MOBILE_ERROR_MESSAGES.locationPermissionDenied); return; }
      await sendRequest(shareEndpoint, 'POST', {}, accessToken);
      setSharing(true);
    } catch { setError(MOBILE_ERROR_MESSAGES.inspectionLocationUnavailable); }
  }

  if (!enabled) return null;
  return <View style={styles.container}>
    {isStudent ? <><Text style={styles.copy}>{INSPECTION_LOCATION_COPY.consent}</Text><Pressable accessibilityRole="button" style={styles.button} onPress={() => void toggleSharing()}><Text style={styles.buttonText}>{sharing ? INSPECTION_LOCATION_COPY.stop : INSPECTION_LOCATION_COPY.share}</Text></Pressable></>
      : <><Text style={styles.copy}>{sharing && sharedLocation ? `${INSPECTION_LOCATION_COPY.locationPrefix}: ${new Date(sharedLocation.updatedAt).toLocaleTimeString()}` : sharing ? INSPECTION_LOCATION_COPY.stale : INSPECTION_LOCATION_COPY.waiting}</Text>{sharedLocation && <Pressable onPress={() => void Linking.openURL(`https://maps.google.com/?q=${sharedLocation.latitude},${sharedLocation.longitude}`)}><Text style={styles.mapLink}>{INSPECTION_LOCATION_COPY.openMap}</Text></Pressable>}</>}
    {!!error && <Text style={styles.error}>{error}</Text>}
  </View>;
}

async function sendRequest<T = unknown>(endpoint: string, method: string, body: unknown, accessToken: string): Promise<T> {
  const response = await fetch(`${MOBILE_API_BASE_URL}${endpoint}`, {
    method,
    headers: { authorization: `Bearer ${accessToken}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(MOBILE_ERROR_MESSAGES.inspectionLocationUnavailable);
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

function createStyles(colors: ReturnType<typeof useMobileTheme>['colors']) { return StyleSheet.create({
  container: { marginTop: 10, gap: 8, padding: 12, borderRadius: 11, backgroundColor: colors.softBlue },
  copy: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  button: { minHeight: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 9, backgroundColor: colors.surface },
  buttonText: { color: colors.primary, fontSize: 10, fontWeight: '800' },
  mapLink: { color: colors.primary, fontSize: 10, fontWeight: '800', textDecorationLine: 'underline' },
  error: { color: colors.error, fontSize: 10 },
}); }
