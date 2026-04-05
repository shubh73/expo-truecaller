import type {
  TruecallerIOSResult,
  TruecallerInitResult,
} from "./ExpoTruecaller.types";
import ExpoTruecallerModule from "./ExpoTruecallerModule";
import { TruecallerError } from "./errors";

/**
 * Initialize the Truecaller SDK.
 *
 * Reads `TruecallerAppKey` and `TruecallerAppLink` from `Info.plist`,
 * which the config plugin sets automatically from your `app.json` config.
 *
 * @return A promise that resolves with the initialization result.
 * @platform ios
 */
export async function initialize(): Promise<TruecallerInitResult> {
  try {
    return await ExpoTruecallerModule.initialize();
  } catch (e) {
    throw TruecallerError.from(e);
  }
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
export async function requestProfile(): Promise<TruecallerIOSResult> {
  try {
    return await ExpoTruecallerModule.requestProfile();
  } catch (e) {
    throw TruecallerError.from(e);
  }
}

/**
 * Check if Truecaller is installed and supported on this device.
 * @return `true` if Truecaller is available.
 * @platform ios
 */
export function isSupported(): boolean {
  return ExpoTruecallerModule.isSupported();
}

/**
 * Clear the SDK instance and release resources.
 * Rejects any pending `requestProfile()` promise with the `CLEARED` error code.
 * @platform ios
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
