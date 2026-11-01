import type { LocalPropertyDraft } from '../models/localPropertyDraft.model';

export function hasPropertyDraftContent(draft: Pick<LocalPropertyDraft, 'name' | 'description' | 'city' | 'rentAmount'>): boolean {
  return Boolean(draft.name || draft.description || draft.city || draft.rentAmount);
}

export function isCompletePropertyDraft(draft: LocalPropertyDraft): boolean {
  return Boolean(draft.name && draft.description && draft.streetAddress && draft.neighborhood
    && draft.city && draft.state && draft.unitName && Number(draft.rentAmount) > 0
    && draft.bedrooms !== '' && draft.bathrooms !== '');
}
