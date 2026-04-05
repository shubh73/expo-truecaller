import type {
  TruecallerAndroidInitOptions,
  TruecallerAndroidResult,
  TruecallerInitResult,
  TruecallerVerifyOptions,
} from "./ExpoTruecaller.types";
import ExpoTruecallerModule from "./ExpoTruecallerModule";
import { TruecallerError } from "./errors";

/**
 * Initialize the Truecaller SDK.
 *
 * Must be called before `verifyUser()`. The returned `isUsable` flag
 * indicates whether Truecaller is installed and the OAuth flow is available.
 *
 * @param options SDK configuration options for the consent dialog appearance.
 * @return A promise that resolves with the initialization result.
 * @platform android
 */
export async function initialize(
  options: TruecallerAndroidInitOptions = {},
): Promise<TruecallerInitResult> {
  try {
    return await ExpoTruecallerModule.initialize(options);
  } catch (e) {
    throw TruecallerError.from(e);
  }
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
export async function verifyUser(
  options: TruecallerVerifyOptions = {},
): Promise<TruecallerAndroidResult> {
  try {
    return await ExpoTruecallerModule.verifyUser(options);
  } catch (e) {
    throw TruecallerError.from(e);
  }
}

/**
 * Clear the SDK instance and release resources.
 * Rejects any pending `verifyUser()` promise with the `CLEARED` error code.
 * @platform android
 */
export function clear(): void {
  ExpoTruecallerModule.clear();
}

export type {
  ConsentHeading,
  CtaTextPrefix,
  ButtonShape,
  FooterType,
  ConsentMode,
  OAuthTheme,
  SdkOption,
  SupportedLanguage,
  OAuthScope,
  TruecallerAndroidInitOptions,
  TruecallerVerifyOptions,
  TruecallerInitResult,
  TruecallerAndroidResult,
  TruecallerIOSResult,
  TruecallerPluginConfig,
} from "./ExpoTruecaller.types";

export { TruecallerError, TruecallerErrorCodes } from "./errors";
export type { TruecallerErrorCode } from "./errors";
