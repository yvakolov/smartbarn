import type { ReferencePlane, VersionedEntity } from '@smartbarn/platform-core';

export interface FloorFieldLayer {
  id: string;
  name: string;
  type: string;
  thicknessMm: number;
  color?: string;
}

export interface FloorFieldGeometry {
  lengthMm: number;
  widthMm: number;
  elevationMm?: number;
}

export interface FloorFieldModel extends VersionedEntity {
  entity: 'floor-field';
  geometry: FloorFieldGeometry;
  referencePlane: ReferencePlane;
  layersAbove: FloorFieldLayer[];
  layersBelow: FloorFieldLayer[];
}
