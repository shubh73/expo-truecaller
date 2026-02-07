// Reexport the native module. On web, it will be resolved to ExpoTruecallerModule.web.ts
// and on native platforms to ExpoTruecallerModule.ts
export { default } from './ExpoTruecallerModule';
export { default as ExpoTruecallerView } from './ExpoTruecallerView';
export * from  './ExpoTruecaller.types';
