import type { FloorFieldLayer, FloorFieldModel } from './model';

export type FloorFieldSide = 'above' | 'below';

export function createDefaultFloorField(): FloorFieldModel {
  return {
    id: 'floor-field-1',
    version: 1,
    entity: 'floor-field',
    geometry: {
      lengthMm: 9000,
      widthMm: 6000,
      elevationMm: 0,
    },
    referencePlane: {
      id: 'datum-top-structural',
      elevationMm: 0,
    },
    layersAbove: [
      {
        id: 'upper-sheathing',
        name: 'Верхняя обшивка',
        type: 'decking',
        thicknessMm: 12,
        color: '#c89f65',
      },
    ],
    layersBelow: [
      {
        id: 'structural',
        name: 'Конструкционный слой',
        type: 'structural',
        thicknessMm: 200,
        color: '#e7d7b1',
      },
      {
        id: 'lower-sheathing',
        name: 'Нижняя обшивка',
        type: 'lining',
        thicknessMm: 12,
        color: '#b48355',
      },
    ],
  };
}

export function addFloorFieldLayer(
  model: FloorFieldModel,
  side: FloorFieldSide,
  layer: FloorFieldLayer,
): FloorFieldModel {
  return side === 'above'
    ? { ...model, version: model.version + 1, layersAbove: [...model.layersAbove, layer] }
    : { ...model, version: model.version + 1, layersBelow: [...model.layersBelow, layer] };
}

export function reorderFloorFieldLayer(
  model: FloorFieldModel,
  side: FloorFieldSide,
  fromIndex: number,
  toIndex: number,
): FloorFieldModel {
  const key = side === 'above' ? 'layersAbove' : 'layersBelow';
  const source = [...model[key]];

  if (fromIndex < 0 || fromIndex >= source.length || toIndex < 0 || toIndex >= source.length) {
    return model;
  }

  const [moved] = source.splice(fromIndex, 1);
  if (!moved) return model;
  source.splice(toIndex, 0, moved);

  return { ...model, version: model.version + 1, [key]: source };
}

export function removeFloorFieldLayer(
  model: FloorFieldModel,
  side: FloorFieldSide,
  layerId: string,
): FloorFieldModel {
  const key = side === 'above' ? 'layersAbove' : 'layersBelow';
  return {
    ...model,
    version: model.version + 1,
    [key]: model[key].filter((layer) => layer.id !== layerId),
  };
}
