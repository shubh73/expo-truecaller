// Fallback entry — resolved when neither .android nor .ios applies (e.g. web).
// Re-exports types and error utilities only; no runtime SDK functions.

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
