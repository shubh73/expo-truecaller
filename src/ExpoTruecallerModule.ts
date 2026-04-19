import { requireNativeModule } from "expo";

import type {
  TruecallerAndroidInitOptions,
  TruecallerAndroidResult,
  TruecallerIOSResult,
  TruecallerInitResult,
  TruecallerVerifyOptions,
} from "./ExpoTruecaller.types";

export default requireNativeModule<{
  initializeAsync(
    options?: TruecallerAndroidInitOptions,
  ): Promise<TruecallerInitResult>;
  verifyUserAsync(
    options: TruecallerVerifyOptions,
  ): Promise<TruecallerAndroidResult>;
  requestProfileAsync(): Promise<TruecallerIOSResult>;
  clear(): void;
}>("ExpoTruecaller");
