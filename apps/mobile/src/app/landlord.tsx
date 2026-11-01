import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Pressable, Text, View } from 'react-native';
import { requestUleyApi } from '../auth/api';
import { useUleyAuth } from '../auth/AuthProvider';
import { MOBILE_API_ENDPOINTS } from '../constants';
import { LabeledInput } from '../components/LabeledInput';
import { AuthPageHeading } from '../components/AuthPageHeading';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenFrame } from '../components/ScreenFrame';
import { AccountRole, VerificationStatus } from '../enums';
import { RentalPeriod, RENTAL_PERIOD_LABELS } from '../enums/rentalPeriod.enum';
import { MOBILE_ERROR_MESSAGES } from '../errors';
import { useMobileTheme } from '../theme';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { MOBILE_PROPERTY_DRAFT_SYNC_INTERVAL_MS } from '../constants/propertyDraft.constant';
import { clearLocalPropertyDraft, readLocalPropertyDraft, saveLocalPropertyDraft } from '../storage/propertyDraft.storage';
import type { LocalPropertyDraft } from '../models/localPropertyDraft.model';
import { createClientDraftId } from '../utils/createClientDraftId';
import { MOBILE_PROPERTY_IMAGE_UPLOAD } from '../constants/propertyImage.constant';
import { usePendingPropertyImages } from '../hooks/usePendingPropertyImages';
import { createLandlordWorkspaceStyles } from '../components/landlordWorkspace.styles';
import { hasPropertyDraftContent, isCompletePropertyDraft } from '../utils/landlordDraft.utils';
import { PropertyCaretakerManager } from '../components/propertyCaretakerManager';

type Verification = { status: VerificationStatus; rejectionReason?: string | null } | null;
type ManagedProperty = { id: string; name: string; description: string; streetAddress: string; neighborhood: string; city: string; state: string; latitude?: number | null; longitude?: number | null; status: string; verification: Verification; units: { id: string; name: string; rentAmount: string; rentalPeriod: RentalPeriod; securityDeposit: string; monthlyServiceCharge: string; inspectionFee: string; bedrooms: number; bathrooms: number; isAvailable: boolean }[]; images: { id: string; imageUrl: string; altText: string }[] };
type PropertyDraft = Omit<LocalPropertyDraft, 'savedAt'>;
const initialDraft: PropertyDraft = { clientDraftId: '', name: '', description: '', streetAddress: '', neighborhood: '', city: '', state: '', unitName: '', rentAmount: '', rentalPeriod: RentalPeriod.YEAR, securityDeposit: '0', monthlyServiceCharge: '0', inspectionFee: '0', bedrooms: '', bathrooms: '' };
const propertyTextFields = ['name', 'description', 'streetAddress', 'neighborhood', 'city', 'state', 'unitName'] as const;
const propertyFieldLabels: Partial<Record<keyof PropertyDraft, string>> = { name: 'Property name', description: 'Description', streetAddress: 'Street address', neighborhood: 'Neighborhood', city: 'City', state: 'State', unitName: 'Available unit name', rentAmount: 'Rent amount (₦)', securityDeposit: 'Refundable security deposit (₦)', monthlyServiceCharge: 'Monthly service charge (₦)', inspectionFee: 'Inspection fee (₦)', bedrooms: 'Bedrooms', bathrooms: 'Bathrooms' };

export default function LandlordWorkspacePage() {
  const { colors } = useMobileTheme();
  const styles = createLandlordWorkspaceStyles(colors);
  const { account, accessToken, isRestoringSession } = useUleyAuth();
  const [verification, setVerification] = useState<Verification>(null);
  const [properties, setProperties] = useState<ManagedProperty[]>([]);
  const [draft, setDraft] = useState<PropertyDraft>({ ...initialDraft, clientDraftId: createClientDraftId() });
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [draftSaveStatus, setDraftSaveStatus] = useState('Draft details save on this device.');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [photoDescription, setPhotoDescription] = useState('');
  const approved = verification?.status === VerificationStatus.APPROVED;

  useEffect(() => {
    if (!account?.id) return;
    let isMounted = true;
    void readLocalPropertyDraft(account.id).then((savedDraft) => {
      if (!isMounted) return;
      if (savedDraft) { setDraft(savedDraft); setDraftSaveStatus('Draft restored from this device.'); }
      setIsDraftRestored(true);
    });
    return () => { isMounted = false; };
  }, [account?.id]);

  useEffect(() => {
    if (!account?.id || !isDraftRestored || !hasPropertyDraftContent(draft)) return;
    const saveTimer = setTimeout(() => {
      void saveLocalPropertyDraft(account.id, { ...draft, savedAt: new Date().toISOString() })
        .then(() => setDraftSaveStatus('Saved on this device. It will sync when you are online.'))
        .catch(() => setDraftSaveStatus('Could not save this draft on the device.'));
    }, 300);
    return () => clearTimeout(saveTimer);
  }, [account?.id, draft, isDraftRestored]);

  const loadWorkspace = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [verificationResult, propertyResult] = await Promise.all([
        requestUleyApi<{ verification: Verification }>(MOBILE_API_ENDPOINTS.landlordVerification, undefined, accessToken),
        requestUleyApi<{ properties: ManagedProperty[] }>(MOBILE_API_ENDPOINTS.landlordProperties, undefined, accessToken),
      ]);
      setVerification(verificationResult.verification);
      setProperties(propertyResult.properties);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : MOBILE_ERROR_MESSAGES.requestFailed); }
  }, [accessToken]);

  const { pendingImages, progress: imageUploadProgress, queueImage } = usePendingPropertyImages({ accountId: account?.id, accessToken, approved, properties, refreshWorkspace: loadWorkspace });

  useEffect(() => {
    if (isRestoringSession) return;
    if (!account) { router.replace('/login'); return; }
    if (account.userRole !== AccountRole.LANDLORD) { router.replace('/account'); return; }
    void loadWorkspace();
  }, [account, isRestoringSession, loadWorkspace]);

  const syncLocalPropertyDraft = useCallback(async () => {
    if (!account?.id || !accessToken || !approved || isBusy) return;
    const localDraft = await readLocalPropertyDraft(account.id);
    if (!localDraft || !isCompletePropertyDraft(localDraft)) return;
    try {
      const { savedAt: _savedAt, propertyId, clientDraftId, ...propertyInput } = localDraft;
      const endpoint = propertyId ? `${MOBILE_API_ENDPOINTS.landlordProperties}/${propertyId}` : MOBILE_API_ENDPOINTS.landlordProperties;
      await requestUleyApi(endpoint, {
        ...(propertyId ? {} : { clientDraftId }),
        ...propertyInput, rentAmount: Number(localDraft.rentAmount), securityDeposit: Number(localDraft.securityDeposit),
        monthlyServiceCharge: Number(localDraft.monthlyServiceCharge), inspectionFee: Number(localDraft.inspectionFee),
        bedrooms: Number(localDraft.bedrooms), bathrooms: Number(localDraft.bathrooms),
      }, accessToken, propertyId ? 'PUT' : 'POST');
      clearLocalPropertyDraft(account.id);
      setDraft({ ...initialDraft, clientDraftId: createClientDraftId() });
      setDraftSaveStatus('Draft synced to your property workspace.');
      await loadWorkspace();
    } catch { setDraftSaveStatus('Saved on this device. Sync will retry when you are online.'); }
  }, [account?.id, accessToken, approved, isBusy, loadWorkspace]);

  useEffect(() => {
    if (!approved) return;
    const syncWhenAppReturns = () => { if (AppState.currentState === 'active') void syncLocalPropertyDraft(); };
    const appStateSubscription = AppState.addEventListener('change', syncWhenAppReturns);
    const syncTimer = setInterval(() => { void syncLocalPropertyDraft(); }, MOBILE_PROPERTY_DRAFT_SYNC_INTERVAL_MS);
    void syncLocalPropertyDraft();
    return () => { appStateSubscription.remove(); clearInterval(syncTimer); };
  }, [approved, syncLocalPropertyDraft]);

  async function requestVerification() {
    if (!accessToken) return;
    setError(''); setIsBusy(true);
    try { await requestUleyApi(MOBILE_API_ENDPOINTS.landlordVerification, {}, accessToken); setNotice('Your request is in the school review queue. Keep your identity documents ready for school review.'); await loadWorkspace(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : MOBILE_ERROR_MESSAGES.requestFailed); }
    finally { setIsBusy(false); }
  }

  async function saveProperty() {
    if (!accessToken) return;
    setError(''); setNotice(''); setIsBusy(true);
    try {
      const { propertyId, clientDraftId, ...draftInput } = draft;
      const endpoint = propertyId ? `${MOBILE_API_ENDPOINTS.landlordProperties}/${propertyId}` : MOBILE_API_ENDPOINTS.landlordProperties;
      const { property } = await requestUleyApi<{ property: ManagedProperty }>(endpoint, { ...(propertyId ? {} : { clientDraftId }), ...draftInput, rentAmount: Number(draft.rentAmount), securityDeposit: Number(draft.securityDeposit), monthlyServiceCharge: Number(draft.monthlyServiceCharge), inspectionFee: Number(draft.inspectionFee), bedrooms: Number(draft.bedrooms), bathrooms: Number(draft.bathrooms) }, accessToken, propertyId ? 'PUT' : 'POST');
      if (account?.id) clearLocalPropertyDraft(account.id);
      setDraft({ ...initialDraft, clientDraftId: createClientDraftId() }); setNotice(`Property draft saved for ${property.name}. Add a photo to begin school review.`); await loadWorkspace();
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : MOBILE_ERROR_MESSAGES.requestFailed); }
    finally { setIsBusy(false); }
  }

  async function capturePropertyLocation() {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) { setError('Location permission was not granted. You can save the property without a map pin.'); return; }
    try {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setDraft((current) => ({ ...current, latitude: position.coords.latitude, longitude: position.coords.longitude }));
      setNotice('Device location saved as this property’s map pin. Capture it while you are at the property.');
    } catch { setError('The property location could not be captured. You can save without a map pin.'); }
  }

  async function addPropertyPhoto(property: ManagedProperty) {
    if (!accessToken || !photoDescription.trim()) { setError('Describe the photo before uploading it.'); return; }
    const selection = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.9 });
    if (selection.canceled) return;
    const photo = selection.assets[0];
    if (!photo) return;
    if (property.images.length + pendingImages.filter((image) => image.propertyId === property.id).length >= MOBILE_PROPERTY_IMAGE_UPLOAD.maximumImagesPerProperty) { setError(MOBILE_ERROR_MESSAGES.propertyImageLimitReached); return; }
    if ((photo.fileSize ?? 0) > MOBILE_PROPERTY_IMAGE_UPLOAD.maximumFileSizeBytes) { setError(MOBILE_ERROR_MESSAGES.propertyImageTooLarge); return; }
    setIsBusy(true); setError('');
    try {
      await queueImage(property.id, photo, photoDescription.trim());
      setNotice('Photo saved on this device. Upload and safety scanning will continue when connected.');
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : MOBILE_ERROR_MESSAGES.requestFailed); }
    finally { setIsBusy(false); }
  }

  async function submitDraftProperty(propertyId: string) {
    if (!accessToken) return;
    try { await requestUleyApi(`${MOBILE_API_ENDPOINTS.landlordProperties}/${propertyId}${MOBILE_API_ENDPOINTS.propertySubmitAction}`, {}, accessToken); setNotice('Property sent to the school for review.'); await loadWorkspace(); }
    catch (submitError) { setError(submitError instanceof Error ? submitError.message : MOBILE_ERROR_MESSAGES.requestFailed); }
  }

  async function toggleUnitAvailability(unitId: string, isAvailable: boolean) {
    if (!accessToken) return;
    try { await requestUleyApi(`${MOBILE_API_ENDPOINTS.landlordProperties}/${unitId}${MOBILE_API_ENDPOINTS.unitAvailabilityAction}`, { isAvailable }, accessToken); setNotice(`Unit marked ${isAvailable ? 'available' : 'unavailable'}.`); await loadWorkspace(); }
    catch (error) { setError(error instanceof Error ? error.message : MOBILE_ERROR_MESSAGES.requestFailed); }
  }

  function editPropertyDraft(property: ManagedProperty) {
    const unit = property.units[0];
    if (!unit) return;
    setDraft({ clientDraftId: createClientDraftId(), propertyId: property.id, name: property.name, description: property.description,
      streetAddress: property.streetAddress, neighborhood: property.neighborhood, city: property.city, state: property.state,
      unitName: unit.name, rentAmount: String(unit.rentAmount), rentalPeriod: unit.rentalPeriod,
      securityDeposit: String(unit.securityDeposit), monthlyServiceCharge: String(unit.monthlyServiceCharge), inspectionFee: String(unit.inspectionFee),
      bedrooms: String(unit.bedrooms), bathrooms: String(unit.bathrooms),
      ...(property.latitude != null && property.longitude != null ? { latitude: property.latitude, longitude: property.longitude } : {}),
    });
    setDraftSaveStatus('Editing a saved draft. Changes will sync when online.');
    setNotice('Property draft loaded. Update the details and save when ready.');
  }

  return <ScreenFrame><AuthPageHeading eyebrow="LANDLORD PROPERTY DESK" title="Make the details clear before students visit." description="Request account review, prepare a property, and follow its progress through the school’s verification process." backPath="/account" /><Pressable style={styles.inspectionLink} onPress={() => router.push('/landlord-ads')}><Text style={styles.inspectionLinkText}>Promote a verified home →</Text></Pressable><Pressable style={styles.inspectionLink} onPress={() => router.push('/inspections')}><Text style={styles.inspectionLinkText}>View inspection requests →</Text></Pressable><Pressable style={styles.inspectionLink} onPress={() => router.push('/landlord-applications' as never)}><Text style={styles.inspectionLinkText}>Review rental applications →</Text></Pressable><View style={styles.panel}><Text style={styles.label}>LANDLORD REVIEW</Text><Text style={styles.status}>{verification?.status ?? 'NOT REQUESTED'}</Text>{verification?.rejectionReason && <Text style={styles.reason}>{verification.rejectionReason}</Text>}{!approved && <PrimaryButton label={verification?.status === VerificationStatus.PENDING ? 'Waiting for school review' : 'Request landlord verification'} onPress={() => void requestVerification()} disabled={verification?.status === VerificationStatus.PENDING || isBusy} loading={isBusy} />}</View>
    {approved && <View style={styles.panel}><Text style={styles.heading}>{draft.propertyId ? 'Edit property draft' : 'Prepare a property draft'}</Text><Text style={styles.copy}>Add a photo after saving, then submit the details and photos for school review.</Text><Text style={styles.copy}>{draftSaveStatus}</Text>{propertyTextFields.map((field) => <LabeledInput key={field} label={propertyFieldLabels[field] ?? field} value={draft[field]} onChangeText={(value) => setDraft((current) => ({ ...current, [field]: value }))} multiline={field === 'description'} numberOfLines={field === 'description' ? 4 : 1} />)}<LabeledInput label={propertyFieldLabels.rentAmount ?? 'Rent amount'} value={draft.rentAmount} onChangeText={(value) => setDraft((current) => ({ ...current, rentAmount: value }))} keyboardType="numeric" /><Text style={styles.copy}>Rent period</Text><Picker selectedValue={draft.rentalPeriod} onValueChange={(value: RentalPeriod) => setDraft((current) => ({ ...current, rentalPeriod: value }))}>{Object.values(RentalPeriod).map((period) => <Picker.Item key={period} label={RENTAL_PERIOD_LABELS[period]} value={period} />)}</Picker>{(['securityDeposit', 'monthlyServiceCharge', 'inspectionFee', 'bedrooms', 'bathrooms'] as const).map((field) => <LabeledInput key={field} label={propertyFieldLabels[field] ?? field} value={draft[field]} onChangeText={(value) => setDraft((current) => ({ ...current, [field]: value }))} keyboardType="numeric" />)}<PrimaryButton label={draft.latitude ? 'Property pin captured' : 'Capture property pin on site'} onPress={() => void capturePropertyLocation()} disabled={isBusy} /><PrimaryButton label={draft.propertyId ? 'Save property changes' : 'Save property draft'} onPress={() => void saveProperty()} disabled={isBusy || !draft.name || !draft.description || !draft.city || !draft.rentAmount} loading={isBusy} />{draft.propertyId && <PrimaryButton label="Start a new property draft" onPress={() => { setDraft({ ...initialDraft, clientDraftId: createClientDraftId() }); setDraftSaveStatus('Draft details save on this device.'); }} disabled={isBusy} />}</View>}
    {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}{!!notice && <Text style={styles.notice} accessibilityRole="text">{notice}</Text>}{!!imageUploadProgress && <Text style={styles.notice} accessibilityRole="text">{imageUploadProgress}</Text>}{pendingImages.length > 0 && <Text style={styles.notice} accessibilityRole="text">{pendingImages.length} photo{pendingImages.length === 1 ? '' : 's'} saved privately on this device until upload and scanning finish.</Text>}<View style={styles.panel}><Text style={styles.heading}>Your property submissions</Text>{properties.length === 0 ? <Text style={styles.copy}>No property submissions yet.</Text> : properties.map((property) => <View key={property.id} style={styles.property}><Text style={styles.propertyName}>{property.name}</Text><Text style={styles.copy}>{property.city} · {property.status.replaceAll('_', ' ')}</Text>{property.status === 'DRAFT' && <Pressable onPress={() => editPropertyDraft(property)}><Text style={styles.action}>Edit property details</Text></Pressable>}{property.units.map((unit) => <View key={unit.id} style={styles.availabilityRow}><Text style={styles.copy}>{unit.name} · {unit.isAvailable ? 'Available' : 'Unavailable'}</Text><Pressable onPress={() => void toggleUnitAvailability(unit.id, !unit.isAvailable)}><Text style={styles.action}>{unit.isAvailable ? 'Pause listing' : 'Mark available'}</Text></Pressable></View>)}{property.status === 'DRAFT' && <><LabeledInput label="Describe the photo" value={photoDescription} onChangeText={setPhotoDescription} /><PrimaryButton label="Add property photo" onPress={() => void addPropertyPhoto(property)} disabled={isBusy || !photoDescription.trim()} /><PrimaryButton label="Submit for school review" onPress={() => void submitDraftProperty(property.id)} disabled={!property.images?.length || isBusy || pendingImages.some((image) => image.propertyId === property.id)} /></>}<PropertyCaretakerManager propertyId={property.id} /></View>)}</View>
  </ScreenFrame>;
}

