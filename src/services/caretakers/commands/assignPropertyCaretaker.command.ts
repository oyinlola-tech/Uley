import { assignPropertyCaretaker } from '../../../repositories/propertyCaretaker.repository.js';
export async function assignCaretakerToProperty(input: Parameters<typeof assignPropertyCaretaker>[0]) {
  return assignPropertyCaretaker(input);
}
