import { readLocalPropertyDraft, saveLocalPropertyDraft } from '../storage/propertyDraft.storage';
import type { LocalPropertyDraft } from '../models/localPropertyDraft.model';

export function savePropertyDraftFormOnDevice(form: HTMLFormElement, latitude?: number, longitude?: number) {
  const formValues = Object.fromEntries(new FormData(form).entries());
  const existingDraft = readLocalPropertyDraft();
  const savedCoordinates = latitude !== undefined && longitude !== undefined
    ? { latitude, longitude }
    : existingDraft?.latitude !== undefined && existingDraft.longitude !== undefined
      ? { latitude: existingDraft.latitude, longitude: existingDraft.longitude }
      : {};
  const draft: LocalPropertyDraft = {
    clientDraftId: existingDraft?.clientDraftId ?? crypto.randomUUID(),
    ...(existingDraft?.propertyId ? { propertyId: existingDraft.propertyId } : {}),
    name: String(formValues.name ?? ''), description: String(formValues.description ?? ''),
    streetAddress: String(formValues.streetAddress ?? ''), neighborhood: String(formValues.neighborhood ?? ''),
    city: String(formValues.city ?? ''), state: String(formValues.state ?? ''), unitName: String(formValues.unitName ?? ''),
    rentAmount: String(formValues.rentAmount ?? ''), rentalPeriod: String(formValues.rentalPeriod ?? 'YEAR'),
    securityDeposit: String(formValues.securityDeposit ?? '0'), monthlyServiceCharge: String(formValues.monthlyServiceCharge ?? '0'),
    inspectionFee: String(formValues.inspectionFee ?? '0'), bedrooms: String(formValues.bedrooms ?? ''), bathrooms: String(formValues.bathrooms ?? ''),
    ...savedCoordinates,
    savedAt: new Date().toISOString(),
  };
  try { saveLocalPropertyDraft(draft); } catch { /* The form remains usable if device storage is unavailable. */ }
}
