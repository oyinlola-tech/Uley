# Uley mobile app

Expo Router app for the Uley student accommodation platform. The welcome journey introduces verified homes, inspections before applying, and the accommodation support path. Auth routes include student/landlord registration, sign-in, email-code password recovery, and signed-in password changes. Students can select an available unit from listings and request a viewing; landlords can confirm or decline requests from the inspection screen. Administrators get role-scoped mobile screens for verification, listing safety, reports, inspections, accounts, super-admin staff management, and the `/admin/logs` audit dashboard.

After a completed visit, students who indicate interest can apply for the specific unit and follow their application at `/applications`. Landlords review, approve, or decline applications at `/landlord-applications`. Approval reserves the unit and requests landlord move-in confirmation; it does not itself mark occupancy or payment as confirmed.

## Run locally

```sh
npm install
npm run start
```

Use `npm run ios`, `npm run android`, or `npm run web` to open a specific target. The app calls the API at `EXPO_PUBLIC_API_BASE_URL`; by default it uses `http://localhost:3001/api/v1`. For a physical device, set this to the development computer's LAN address, for example `http://192.168.1.20:3001/api/v1`. Use HTTPS for hosted environments.

## Auth storage

The long-lived rotating refresh token is kept in Expo SecureStore. The short-lived access token stays in app memory. Sign-out and password changes revoke the native session through the API. The API enforces administrator roles on every admin action.

## API setup for password recovery

Sync the Prisma schema with `npm run prisma:db:push` before using password recovery. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `SMTP_FROM_ADDRESS` in the API environment. In local development without SMTP, the API prints the one-time recovery code to its terminal; production requires SMTP delivery.

Email codes expire after ten minutes, are limited to five verification attempts, and can be requested once per minute. The app displays three illustrated introduction screens before account type selection.

## Mobile push notifications

Set `EXPO_PUBLIC_EAS_PROJECT_ID` in the mobile app environment and configure Android FCM v1 and Apple push credentials for that EAS project before building a development or production app. The app asks for permission only when a signed-in user enables phone notifications in Account. Device tokens are account-scoped, removed on sign-out, and automatically registered again after sign-in when the user has opted in. Push text is intentionally generic; chat and support details stay in the authenticated app. Web continues to use the in-app notification inbox.

Run `npm run prisma:generate` and sync the Prisma schema before enabling device registration. The API can send through Expo Push Service; set `EXPO_PUSH_ACCESS_TOKEN` only if enhanced push security is enabled for the EAS project. Remote push requires a native development or production build with credentials; it cannot be fully exercised from a web export.
