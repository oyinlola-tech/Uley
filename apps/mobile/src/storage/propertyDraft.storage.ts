import { File, Paths } from 'expo-file-system';
import { MOBILE_PROPERTY_DRAFT_FILE_NAME } from '../constants/propertyDraft.constant';
import type { LocalPropertyDraft } from '../models/localPropertyDraft.model';
import { RentalPeriod } from '../enums/rentalPeriod.enum';

export async function readLocalPropertyDraft(accountId: string): Promise<LocalPropertyDraft | null> {
  try {
    const draftFile = getDraftFile(accountId);
    if (!draftFile.exists) return null;
    const savedDraft = JSON.parse(await draftFile.text()) as Partial<LocalPropertyDraft> & { monthlyRent?: string };
    return {
      ...savedDraft,
      rentAmount: savedDraft.rentAmount ?? savedDraft.monthlyRent ?? '',
      rentalPeriod: savedDraft.rentalPeriod ?? (savedDraft.monthlyRent ? RentalPeriod.MONTH : RentalPeriod.YEAR),
    } as LocalPropertyDraft;
  } catch { return null; }
}

export async function saveLocalPropertyDraft(accountId: string, draft: LocalPropertyDraft): Promise<void> {
  getDraftFile(accountId).write(JSON.stringify(draft));
}

export function clearLocalPropertyDraft(accountId: string): void {
  const draftFile = getDraftFile(accountId);
  if (draftFile.exists) draftFile.delete();
}

function getDraftFile(accountId: string) {
  const safeAccountId = accountId.replaceAll(/[^a-zA-Z0-9-]/g, '');
  return new File(Paths.document, `${MOBILE_PROPERTY_DRAFT_FILE_NAME}-${safeAccountId}.json`);
}
