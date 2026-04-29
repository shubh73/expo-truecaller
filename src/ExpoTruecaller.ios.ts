import type {
  TruecallerIOSResult,
  TruecallerInitResult,
} from "./ExpoTruecaller.types";
import ExpoTruecallerModule from "./ExpoTruecallerModule";

/**
 * Initialize the Truecaller SDK.
 *
 * Reads `TruecallerAppKey` and `TruecallerAppLink` from `Info.plist`,
 * which the config plugin sets automatically from your `app.json` config.
 *
 * @return A promise that resolves with the initialization result.
 * @platform ios
 */
export async function initializeAsync(): Promise<TruecallerInitResult> {
  return ExpoTruecallerModule.initializeAsync();
}

/**
 * Request the user's Truecaller profile.
 *
 * Unlike Android's OAuth flow, the iOS SDK returns profile data directly
 * without requiring a backend token exchange.
 *
 * @return A promise that resolves with the user's Truecaller profile.
 * @platform ios
 */
export async function requestProfileAsync(): Promise<TruecallerIOSResult> {
  return ExpoTruecallerModule.requestProfileAsync();
}

/**
 * Clear the SDK instance and release resources.
 * Rejects any pending `requestProfileAsync()` promise with `ERR_CLEARED`.
 * @platform ios
 */
export function clear(): void {
  ExpoTruecallerModule.clear();
}

export * from "./ExpoTruecaller.types";
export * from "./errors";
