import type {
  TruecallerAndroidInitOptions,
  TruecallerAndroidResult,
  TruecallerInitResult,
  TruecallerVerifyOptions,
} from "./ExpoTruecaller.types";
import ExpoTruecallerModule from "./ExpoTruecallerModule";

/**
 * Initialize the Truecaller SDK.
 *
 * Must be called before `verifyUserAsync()`. The returned `isUsable` flag
 * indicates whether Truecaller is installed and the OAuth flow is available.
 *
 * @param options SDK configuration options for the consent dialog appearance.
 * @return A promise that resolves with the initialization result.
 * @platform android
 */
export async function initializeAsync(
  options: TruecallerAndroidInitOptions = {},
): Promise<TruecallerInitResult> {
  return ExpoTruecallerModule.initializeAsync(options);
}

/**
 * Trigger the Truecaller OAuth verification flow.
 *
 * Returns an authorization code and PKCE code verifier on success.
 * Send both to your backend to exchange for an access token via
 * `POST https://oauth-account-noneu.truecaller.com/v1/token`.
 *
 * @param options OAuth options including scopes. Defaults to `["profile", "phone"]`.
 * @return A promise that resolves with the authorization code, code verifier, and granted scopes.
 * @platform android
 */
export async function verifyUserAsync(
  options: TruecallerVerifyOptions = {},
): Promise<TruecallerAndroidResult> {
  return ExpoTruecallerModule.verifyUserAsync(options);
}

/**
 * Clear the SDK instance and release resources.
 * Rejects any pending `verifyUserAsync()` promise with `ERR_CLEARED`.
 * @platform android
 */
export function clear(): void {
  ExpoTruecallerModule.clear();
}

export * from "./ExpoTruecaller.types";
export * from "./errors";
