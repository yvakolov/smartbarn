import type { FloorFieldModel } from '../domain/model';

export const FLOOR_FIELD_JSON_FORMAT = 'smartbarn.floor-field' as const;
export const FLOOR_FIELD_JSON_SCHEMA_VERSION = 1 as const;

export interface FloorFieldJsonDocument {
  readonly format: typeof FLOOR_FIELD_JSON_FORMAT;
  readonly schemaVersion: typeof FLOOR_FIELD_JSON_SCHEMA_VERSION;
  readonly exportedAt: string;
  readonly model: FloorFieldModel;
}

/** Serializes the deterministic Floor Field domain model without renderer state. */
export function serializeFloorFieldJson(model: FloorFieldModel): string {
  const document: FloorFieldJsonDocument = {
    format: FLOOR_FIELD_JSON_FORMAT,
    schemaVersion: FLOOR_FIELD_JSON_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    model,
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}

/** Parses and validates a SmartBarn Floor Field JSON transport document. */
export function parseFloorFieldJson(input: string): FloorFieldModel {
  const document = JSON.parse(input) as Partial<FloorFieldJsonDocument>;
  if (document.format !== FLOOR_FIELD_JSON_FORMAT || document.schemaVersion !== FLOOR_FIELD_JSON_SCHEMA_VERSION) {
    throw new Error('Unsupported SmartBarn Floor Field JSON format or schema version.');
  }
  return validateFloorFieldModel(document.model);
}

export function validateFloorFieldModel(value: unknown): FloorFieldModel {
  if (!value || typeof value !== 'object') throw new Error('Floor Field model is missing.');
  const model = value as Partial<FloorFieldModel>;
  if (model.entity !== 'floor-field' || typeof model.id !== 'string' || !model.id) {
    throw new Error('Invalid Floor Field identity.');
  }
  if (!Number.isInteger(model.version) || Number(model.version) < 1) throw new Error('Invalid Floor Field version.');
  if (!model.geometry || !isFinitePositive(model.geometry.lengthMm) || !isFinitePositive(model.geometry.widthMm)) {
    throw new Error('Invalid Floor Field geometry.');
  }
  if (model.geometry.elevationMm !== undefined && !Number.isFinite(model.geometry.elevationMm)) {
    throw new Error('Invalid Floor Field elevation.');
  }
  if (!model.referencePlane || typeof model.referencePlane.id !== 'string' || !Number.isFinite(model.referencePlane.elevationMm)) {
    throw new Error('Invalid Floor Field reference plane.');
  }
  if (!Array.isArray(model.layersAbove) || !Array.isArray(model.layersBelow)) {
    throw new Error('Invalid Floor Field layer collections.');
  }
  [...model.layersAbove, ...model.layersBelow].forEach((layer, index) => {
    if (!layer || typeof layer.id !== 'string' || !layer.id || typeof layer.name !== 'string' || typeof layer.type !== 'string') {
      throw new Error(`Invalid Floor Field layer at index ${index}.`);
    }
    if (!isFinitePositive(layer.thicknessMm)) throw new Error(`Invalid layer thickness at index ${index}.`);
    if (layer.color !== undefined && typeof layer.color !== 'string') throw new Error(`Invalid layer color at index ${index}.`);
  });
  return model as FloorFieldModel;
}

function isFinitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
