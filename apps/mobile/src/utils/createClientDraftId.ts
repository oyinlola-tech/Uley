export function createClientDraftId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const randomValue = Math.floor(Math.random() * 16);
    const uuidDigit = character === 'x' ? randomValue : (randomValue & 0x3) | 0x8;
    return uuidDigit.toString(16);
  });
}
