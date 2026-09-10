import type { SmartBarnModuleManifest } from '@smartbarn/platform-core';

export * from './lib/domain/model';
export * from './lib/domain/floor-field';

export const FLOOR_FIELD_MODULE: SmartBarnModuleManifest = {
  id: 'floor-field',
  name: 'Floor field',
  version: '0.1.0',
  entityTypes: ['floor-field'],
  capabilities: [
    { id: 'geometry.edit' },
    { id: 'layers.edit' },
    { id: 'layers.reorder' },
    { id: 'view.2d' },
    { id: 'view.3d' },
  ],
};
