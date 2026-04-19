# Test Plan

## Setup

```
cd example
npm install
npx expo run:android   # or npx expo run:ios
```

Ensure `app.json` has valid Truecaller credentials in the plugin config.

## Demo Screen

### Android

1. Tap "Initialize SDK" → should show `isUsable: true` (if Truecaller installed)
2. Tap "Verify with Truecaller" → Truecaller consent sheet appears
3. Accept → auth code, scopes, verifier displayed
4. Tap "Clear SDK" → state resets

### iOS

1. Tap "Initialize SDK" → should show `isUsable: true` (if Truecaller installed)
2. Tap "Request Profile" → Truecaller profile request triggers
3. Accept → name, phone, email displayed
4. Tap "Clear SDK" → state resets

### Cancel path

1. Initialize → Verify/Request Profile → dismiss the dialog
2. Should show "User cancelled" message, not an error

### Unavailable path

1. Uninstall Truecaller → Initialize → `isUsable: false`
2. Verify button should be disabled

## Validation Screen

### Availability Check

- Run → should pass on both platforms

### Initialize

- Run → should resolve with `initialized: true`

### Verify / Request Profile

- Run → shows consent UI → accept or cancel → should pass

### Concurrent Requests

- Run → fires two calls simultaneously
- Second call should reject with `ERR_ALREADY_IN_PROGRESS`
- First call proceeds normally
- Scenario should show ✓
