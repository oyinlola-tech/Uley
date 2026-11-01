export type HttpErrorIllustrationScene = 'paper' | 'key' | 'gate' | 'map' | 'sign' | 'clock' | 'overlap' | 'vacant' | 'parcel' | 'format' | 'form' | 'queue' | 'workshop' | 'blueprint' | 'bridge' | 'bench' | 'hourglass';
export type HttpErrorStatusDetails = { title: string; message: string; label: string; scene: HttpErrorIllustrationScene; action?: string; href?: string };

export const HTTP_ERROR_STATUS = {
  400: { title: 'That request needs a second look', message: 'Some information did not arrive in the shape we expected. Check it and try again.', label: 'REQUEST CHECK', scene: 'paper' },
  401: { title: 'Sign in to continue', message: 'This part of Uley is for signed-in members. Your place is one quick sign-in away.', label: 'MEMBER ACCESS', scene: 'key', action: 'Sign in', href: '/login' },
  403: { title: 'This door is not yours to open', message: 'Your account does not have access to this page. Head back to your workspace or ask an admin for help.', label: 'ACCESS RESTRICTED', scene: 'gate' },
  404: { title: 'This route ends here', message: 'We couldn’t find that page. The address may have changed, but your search for a place to land can keep going.', label: 'ROUTE NOT FOUND', scene: 'map' },
  405: { title: 'That action is not available here', message: 'This page does not accept that kind of request. Return to the page and choose one of its available actions.', label: 'ACTION UNAVAILABLE', scene: 'sign' },
  408: { title: 'The connection took too long', message: 'The request timed out on its way here. Check your connection and give it another try.', label: 'REQUEST TIMED OUT', scene: 'clock' },
  409: { title: 'This changed while you were here', message: 'The information no longer matches the latest version. Refresh the page to see the current details.', label: 'UPDATE CONFLICT', scene: 'overlap' },
  410: { title: 'This place has left the guide', message: 'The page or listing is no longer available. Browse current homes to find another option.', label: 'NO LONGER AVAILABLE', scene: 'vacant' },
  413: { title: 'This upload is too large', message: 'The file is larger than this upload allows. Choose a smaller image or video and try again.', label: 'UPLOAD LIMIT', scene: 'parcel' },
  415: { title: 'We can’t read this file type', message: 'Choose a supported photo or video format, then upload it again.', label: 'FILE TYPE NOT SUPPORTED', scene: 'format' },
  422: { title: 'A few details need attention', message: 'We could not save this information yet. Review the highlighted fields and try again.', label: 'DETAILS NEED REVIEW', scene: 'form' },
  429: { title: 'A short pause, then try again', message: 'You have made several requests in a short time. Wait a moment before continuing.', label: 'TAKE A BREATH', scene: 'queue' },
  500: { title: 'Something went wrong on our side', message: 'The page hit an unexpected problem. Try again, and contact support if it keeps happening.', label: 'UNEXPECTED ERROR', scene: 'workshop' },
  501: { title: 'This feature is not ready yet', message: 'Uley does not support this action yet. Return to your workspace to keep moving.', label: 'NOT IMPLEMENTED', scene: 'blueprint' },
  502: { title: 'The handoff was interrupted', message: 'A service Uley relies on returned an unexpected response. Try again in a little while.', label: 'UPSTREAM RESPONSE', scene: 'bridge' },
  503: { title: 'Uley is taking a brief pause', message: 'This part of the platform is temporarily unavailable. Please come back shortly.', label: 'TEMPORARILY UNAVAILABLE', scene: 'bench' },
  504: { title: 'The other end did not answer', message: 'A service took too long to reply. Your connection may be fine; try again shortly.', label: 'GATEWAY TIMEOUT', scene: 'hourglass' },
} as const satisfies Record<number, HttpErrorStatusDetails>;

export type HttpErrorStatusCode = keyof typeof HTTP_ERROR_STATUS;

export function getHttpErrorStatusCode(value: string): HttpErrorStatusCode | undefined {
  const code = Number(value) as HttpErrorStatusCode;
  return Object.hasOwn(HTTP_ERROR_STATUS, code) ? code : undefined;
}
