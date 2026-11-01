import { removePropertyCaretaker } from '../../../repositories/propertyCaretaker.repository.js';
export async function removeCaretakerFromProperty(input: Parameters<typeof removePropertyCaretaker>[0]) {
  return removePropertyCaretaker(input);
}
