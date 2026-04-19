// Fallback entry — resolved when neither .android nor .ios applies (e.g. web).
// Also serves as the type declaration entry point for tsc consumers.
// At runtime, Metro resolves index.android.ts or index.ios.ts instead.

import type {
  TruecallerAndroidInitOptions,
  TruecallerAndroidResult,
  TruecallerIOSResult,
  TruecallerInitResult,
  TruecallerVerifyOptions,
} from "./ExpoTruecaller.types";

export * from "./ExpoTruecaller.types";
export * from "./errors";

/**
 * Initialize the Truecaller SDK.
 * @param options SDK configuration options (Android only).
 * @return A promise that resolves with the initialization result.
 */
export async function initializeAsync(
  _options?: TruecallerAndroidInitOptions,
): Promise<TruecallerInitResult> {
  throw new Error("expo-truecaller is not available on this platform");
}

/**
 * Trigger the Truecaller OAuth verification flow.
 * @param options OAuth options including scopes.
 * @return A promise that resolves with the authorization code, code verifier, and granted scopes.
 * @platform android
 */
export async function verifyUserAsync(
  _options?: TruecallerVerifyOptions,
): Promise<TruecallerAndroidResult> {
  throw new Error("expo-truecaller is not available on this platform");
}

/**
 * Request the user's Truecaller profile.
 * @return A promise that resolves with the user's Truecaller profile.
 * @platform ios
 */
export async function requestProfileAsync(): Promise<TruecallerIOSResult> {
  throw new Error("expo-truecaller is not available on this platform");
}

/**
 * Clear the SDK instance and release resources.
 */
export function clear(): void {
  // no-op on unsupported platforms
}
