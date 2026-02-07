import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoTruecallerViewProps } from './ExpoTruecaller.types';

const NativeView: React.ComponentType<ExpoTruecallerViewProps> =
  requireNativeView('ExpoTruecaller');

export default function ExpoTruecallerView(props: ExpoTruecallerViewProps) {
  return <NativeView {...props} />;
}
