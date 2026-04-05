import { NativeModule, requireNativeModule } from "expo";

import type {
  ExpoTruecallerModuleEvents,
  TruecallerAndroidInitOptions,
  TruecallerAndroidResult,
  TruecallerIOSResult,
  TruecallerInitResult,
  TruecallerVerifyOptions,
} from "./ExpoTruecaller.types";

/** @internal Native module bridge declaration. */
declare class ExpoTruecallerModuleClass extends NativeModule<ExpoTruecallerModuleEvents> {
  initialize(
    options: TruecallerAndroidInitOptions,
  ): Promise<TruecallerInitResult>;
  initialize(): Promise<TruecallerInitResult>;
  verifyUser(
    options: TruecallerVerifyOptions,
  ): Promise<TruecallerAndroidResult>;
  requestProfile(): Promise<TruecallerIOSResult>;
  isSupported(): boolean;
  clear(): void;
}

export default requireNativeModule<ExpoTruecallerModuleClass>("ExpoTruecaller");
