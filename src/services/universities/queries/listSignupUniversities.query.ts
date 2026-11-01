import { findUniversitiesAcceptingRegistration } from '../../../repositories/university.repository.js';

export async function listUniversitiesAcceptingRegistration() {
  return findUniversitiesAcceptingRegistration();
}
