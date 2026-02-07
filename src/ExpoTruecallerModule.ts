import { NativeModule, requireNativeModule } from 'expo';

import { ExpoTruecallerModuleEvents } from './ExpoTruecaller.types';

declare class ExpoTruecallerModule extends NativeModule<ExpoTruecallerModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoTruecallerModule>('ExpoTruecaller');
