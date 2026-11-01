export const WEB_ERROR_MESSAGES = {
  accountServiceUnavailable: 'Uley could not reach the account service. Check your connection and try again.',
  requestFailed: 'We couldn’t complete that request. Try again.',
  requestFailedPleaseRetry: 'We couldn’t complete that request. Please try again.',
  signInSessionMissing: 'Sign-in completed without a session token. Please try again.',
  signOutFailed: 'We could not sign you out. Check your connection and try again.',
  signInRequired: 'Sign in with an account authorized for this workspace.',
  signInLandlordRequired: 'Sign in with a landlord account to access your property workspace.',
  passwordsDoNotMatch: 'Those passwords do not match.',
  sessionExpired: 'Your sign-in has expired. Sign in again before changing your password.',
  recoveryCodeInvalid: 'That code is invalid or expired. Request a new one and try again.',
  listingsUnavailable: 'We couldn’t load homes right now. Check your connection and try again.',
  inspectionsUnavailable: 'We couldn’t load inspection requests. Check your connection and try again.',
  rentalApplicationsUnavailable: 'We couldn’t load rental applications. Check your connection and try again.',
  rentalApplicationSignInRequired: 'Sign in again to view or submit applications.',
  rentalApplicationSubmitFailed: 'We couldn’t submit your application. Refresh and try again.',
  rentalApplicationUpdateFailed: 'That application has changed. Refresh and try again.',
  inspectionRequestSent: 'Your inspection request has been sent to the landlord.',
  locationPermissionDenied: 'Location access was not granted. You can continue without sharing it.',
  inspectionLocationUnavailable: 'Inspection location sharing could not be updated. Try again.',
  adminDashboardUnavailable: 'We couldn’t load the admin dashboard. Check your connection and try again.',
  propertyReportSent: 'Your report has been sent to the school for review.',
  propertyImageAndDescriptionRequired: 'Choose a photo and describe it for students.',
  propertyImageTooLarge: 'Photos must be 10 MB or smaller.',
  propertyImageLimitReached: 'A property can have at most 12 photos, including photos waiting to upload.',
  propertyImageStorageFailed: 'The photo could not be saved in this browser. Check available storage and try again.',
  propertyImageScanRejected: 'This photo did not pass the safety scan. Choose another photo.',
  propertyImageScanUnavailable: 'The photo is still saved here. Its safety scan will resume automatically.',
  caretakerListUnavailable: 'The assigned caretaker list could not be loaded.',
  caretakerAssignFailed: 'The caretaker could not be assigned. Try again.',
  caretakerRemoveFailed: 'Caretaker access could not be removed. Try again.',
} as const;

export function getUserFacingErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof TypeError) return WEB_ERROR_MESSAGES.accountServiceUnavailable;
  return error instanceof Error ? error.message : fallbackMessage;
}

export function getApiResponseErrorMessage(message: string, statusCode: number, requestId?: string): string {
  return statusCode >= 500 && requestId ? `${message} · Ref ${requestId}` : message;
}
