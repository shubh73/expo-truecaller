import { CodedError } from "expo-modules-core";

/**
 * All known error codes from the Truecaller SDK and this module.
 *
 * Android SDK error codes are mapped from their numeric values to semantic names
 * on the native side. iOS SDK error codes are prefixed with `IOS_`.
 */
export const TruecallerErrorCodes = {
  // Android SDK callback errors (mapped from TcOAuthError numeric codes)
  NETWORK_FAILURE: "NETWORK_FAILURE",
  USER_CANCELLED: "USER_CANCELLED",
  VERIFICATION_REQUIRED: "VERIFICATION_REQUIRED",
  MISSING_CLIENT_ID: "MISSING_CLIENT_ID",
  NOT_INSTALLED: "NOT_INSTALLED",
  SDK_ERROR: "SDK_ERROR",
  USER_NOT_SIGNED_IN: "USER_NOT_SIGNED_IN",
  USER_DISMISSED: "USER_DISMISSED",
  USER_PRESSED_BACK: "USER_PRESSED_BACK",
  SDK_TOO_OLD: "SDK_TOO_OLD",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",

  // Module-level errors
  NOT_INITIALIZED: "NOT_INITIALIZED",
  NO_ACTIVITY: "NO_ACTIVITY",
  NOT_AVAILABLE: "NOT_AVAILABLE",
  LAUNCHER_NOT_REGISTERED: "LAUNCHER_NOT_REGISTERED",
  PKCE_FAILED: "PKCE_FAILED",
  CLEARED: "CLEARED",
  ACTIVITY_DESTROYED: "ACTIVITY_DESTROYED",
  INIT_FAILED: "INIT_FAILED",
  RESULT_ERROR: "RESULT_ERROR",
  VERIFICATION_FAILED: "VERIFICATION_FAILED",

  // iOS-specific
  IOS_NOT_SUPPORTED: "IOS_NOT_SUPPORTED",
  IOS_USER_CANCELLED: "IOS_USER_CANCELLED",
  IOS_APP_KEY_MISSING: "IOS_APP_KEY_MISSING",
  IOS_APP_LINK_MISSING: "IOS_APP_LINK_MISSING",
  IOS_USER_NOT_SIGNED_IN: "IOS_USER_NOT_SIGNED_IN",
  IOS_SDK_TOO_OLD: "IOS_SDK_TOO_OLD",
} as const;

/** Union of all possible Truecaller error codes. */
export type TruecallerErrorCode =
  (typeof TruecallerErrorCodes)[keyof typeof TruecallerErrorCodes];

/**
 * Typed error for all Truecaller SDK failures.
 * Extends `CodedError` from `expo-modules-core` for Expo ecosystem consistency.
 *
 * @example
 * ```ts
 * try {
 *   await verifyUser();
 * } catch (error) {
 *   if (error instanceof TruecallerError) {
 *     switch (error.code) {
 *       case TruecallerErrorCodes.USER_CANCELLED:
 *       case TruecallerErrorCodes.USER_PRESSED_BACK:
 *       case TruecallerErrorCodes.USER_DISMISSED:
 *         // User cancelled — not an error
 *         break;
 *       case TruecallerErrorCodes.NOT_INSTALLED:
 *         // Truecaller not available on this device
 *         break;
 *     }
 *   }
 * }
 * ```
 */
export class TruecallerError extends CodedError {
  override readonly code: string;

  constructor(code: string, message: string) {
    super(code, message);
    this.name = "TruecallerError";
    this.code = code;
  }

  /** Wrap a native module rejection into a `TruecallerError`. */
  static from(error: unknown): TruecallerError {
    if (error instanceof TruecallerError) return error;
    if (error instanceof Error) {
      const nativeCode = (error as { code?: string }).code;
      return new TruecallerError(
        nativeCode ?? "UNKNOWN_ERROR",
        error.message ?? "An unknown error occurred",
      );
    }
    return new TruecallerError("UNKNOWN_ERROR", String(error));
  }
}
