import { WEB_AUTH_STORAGE_KEYS } from '../constants/authStorage.constant';
import { WEB_PROPERTY_DRAFT_STORAGE_KEY } from '../constants/propertyDraft.constant';
import type { LocalPropertyDraft } from '../models/localPropertyDraft.model';
import { RentalPeriod } from '../enums/rentalPeriod.enum';

export function readLocalPropertyDraft(): LocalPropertyDraft | null {
  try {
    const serializedDraft = window.localStorage.getItem(getStorageKey());
    if (!serializedDraft) return null;
    const savedDraft = JSON.parse(serializedDraft) as Partial<LocalPropertyDraft> & { monthlyRent?: string };
    return {
      ...savedDraft,
      rentAmount: savedDraft.rentAmount ?? savedDraft.monthlyRent ?? '',
      rentalPeriod: savedDraft.rentalPeriod ?? (savedDraft.monthlyRent ? RentalPeriod.MONTH : RentalPeriod.YEAR),
    } as LocalPropertyDraft;
  } catch { return null; }
}

export function saveLocalPropertyDraft(draft: LocalPropertyDraft): void {
  window.localStorage.setItem(getStorageKey(), JSON.stringify(draft));
}

export function clearLocalPropertyDraft(): void {
  window.localStorage.removeItem(getStorageKey());
}

function getStorageKey(): string {
  const tokenPayload = window.sessionStorage.getItem(WEB_AUTH_STORAGE_KEYS.accessToken)?.split('.')[1];
  if (!tokenPayload) return WEB_PROPERTY_DRAFT_STORAGE_KEY;
  const base64Payload = tokenPayload.replaceAll('-', '+').replaceAll('_', '/');
  const accountId = (JSON.parse(window.atob(base64Payload)) as { sub?: string }).sub;
  return accountId ? `${WEB_PROPERTY_DRAFT_STORAGE_KEY}.${accountId}` : WEB_PROPERTY_DRAFT_STORAGE_KEY;
}
