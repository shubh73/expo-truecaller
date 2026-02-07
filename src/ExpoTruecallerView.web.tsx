import * as React from 'react';

import { ExpoTruecallerViewProps } from './ExpoTruecaller.types';

export default function ExpoTruecallerView(props: ExpoTruecallerViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
