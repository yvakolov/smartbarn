export type SmartBarnEntityType = 'floor-field' | 'wall' | 'roof';

export interface SmartBarnLayer {
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

export interface FloorFieldModel {
  id: string;
  entity: 'floor-field';
  geometry: FloorFieldGeometry;
  layers: SmartBarnLayer[];
}

export interface SmartBarnModel {
  version: string;
  entities: FloorFieldModel[];
}
