import { registerWebModule, NativeModule } from 'expo';

import { ExpoTruecallerModuleEvents } from './ExpoTruecaller.types';

class ExpoTruecallerModule extends NativeModule<ExpoTruecallerModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ExpoTruecallerModule, 'ExpoTruecallerModule');
