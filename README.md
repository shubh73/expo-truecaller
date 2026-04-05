# expo-truecaller

Expo module wrapping the [Truecaller SDK](https://docs.truecaller.com/) for both Android (OAuth 3.2.1) and iOS (TrueSDK). Android returns an OAuth authorization code for backend token exchange; iOS returns the user's Truecaller profile directly.

## Installation

```
npx expo install expo-truecaller
```

Add the config plugin to your `app.json` / `app.config.ts`:

```json
{
  "plugins": [
    [
      "expo-truecaller",
      {
        "androidClientId": "YOUR_ANDROID_CLIENT_ID",
        "iosAppKey": "YOUR_IOS_APP_KEY",
        "iosAppLink": "https://your-app-link.com"
      }
    ]
  ]
}
```

`androidClientId` is required. iOS fields are optional — omit them to skip iOS setup.

The plugin automatically configures:

- **Android:** `com.truecaller.android.sdk.ClientId` in `AndroidManifest.xml`
- **iOS:** URL scheme, `LSApplicationQueriesSchemes`, `Info.plist` credentials, associated domains entitlement, and `continueUserActivity` forwarding

## API

### Android

#### `initialize(options?)`

```typescript
function initialize(options?: TruecallerAndroidInitOptions): Promise<TruecallerInitResult>
```

Initialize the Truecaller SDK. Must be called before `verifyUser()`.

Returns `{ initialized: boolean, isUsable: boolean }`. The `isUsable` flag indicates whether the Truecaller app is installed and the user is logged in.

Options (all optional): `consentMode`, `heading`, `ctaTextPrefix`, `buttonShape`, `footerType`, `theme`, `language`, `buttonColor`, `buttonTextColor`, `sdkOption`.

#### `verifyUser(options?)`

```typescript
function verifyUser(options?: TruecallerVerifyOptions): Promise<TruecallerAndroidResult>
```

Trigger the Truecaller OAuth verification flow.

Returns `{ authorizationCode, codeVerifier, scopesGranted }`. Exchange `authorizationCode` and `codeVerifier` on your backend via `POST https://oauth-account-noneu.truecaller.com/v1/token`.

Options: `scopes` (defaults to `["profile", "phone"]`).

#### `clear()`

```typescript
function clear(): void
```

Clear the SDK instance and release resources. Rejects any pending `verifyUser()` promise with `CLEARED`.

### iOS

#### `initialize()`

```typescript
function initialize(): Promise<TruecallerInitResult>
```

Initialize the Truecaller SDK. Reads credentials from `Info.plist` (set by the config plugin).

Returns `{ initialized: boolean, isUsable: boolean }`.

#### `requestProfile()`

```typescript
function requestProfile(): Promise<TruecallerIOSResult>
```

Request the user's Truecaller profile. Unlike Android, the iOS SDK returns profile data directly without a backend token exchange.

Returns `{ firstName, lastName, phoneNumber, countryCode, email, gender, avatarUrl, city, isVerified }`.

#### `isSupported()`

```typescript
function isSupported(): boolean
```

Check if Truecaller is installed and supported on this device.

#### `clear()`

```typescript
function clear(): void
```

Clear the SDK instance. Rejects any pending `requestProfile()` promise with `CLEARED`.

### Error codes

All errors are thrown as `TruecallerError` (extends `CodedError` from `expo-modules-core`) with a semantic `.code`:

| Code | Platform | Meaning |
|------|----------|---------|
| `USER_CANCELLED` | Android | User cancelled the consent dialog |
| `USER_PRESSED_BACK` | Android | User pressed the back button |
| `USER_DISMISSED` | Android | User dismissed the dialog |
| `NOT_INSTALLED` | Both | Truecaller app is not installed |
| `NOT_AVAILABLE` | Android | OAuth flow is not usable |
| `NOT_INITIALIZED` | Both | `initialize()` was not called |
| `NETWORK_FAILURE` | Both | Network error |
| `SDK_ERROR` | Both | Internal SDK error |
| `SDK_TOO_OLD` | Both | Truecaller app version is too old |
| `CLEARED` | Both | `clear()` was called while a request was pending |
| `IOS_USER_CANCELLED` | iOS | User cancelled the profile request |
| `IOS_NOT_SUPPORTED` | iOS | Truecaller is not supported on this device |

## Usage

### Android

```typescript
import { initialize, verifyUser, clear, TruecallerError, TruecallerErrorCodes } from "expo-truecaller";

const { isUsable } = await initialize({
  consentMode: "bottomsheet",
  heading: "logInTo",
  theme: "dark",
});

if (isUsable) {
  try {
    const { authorizationCode, codeVerifier } = await verifyUser();
    // Send authorizationCode + codeVerifier to your backend
  } catch (e) {
    if (e instanceof TruecallerError && e.code === TruecallerErrorCodes.USER_CANCELLED) {
      // User cancelled — fall back to OTP
    }
  }
}
```

### iOS

```typescript
import { initialize, requestProfile, isSupported } from "expo-truecaller";

await initialize();

if (isSupported()) {
  const profile = await requestProfile();
  console.log(profile.firstName, profile.phoneNumber);
}
```

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.
