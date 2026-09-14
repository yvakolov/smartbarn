export interface FoundationModel {
  readonly baseElevationMm: number;
  readonly heightMm: number;
}

export interface StoreyModel {
  readonly id: string;
  readonly name: string;
  readonly baseElevationMm: number;
  readonly heightMm: number;
}

export interface BuildingStructureModel {
  readonly version: 1;
  readonly foundation: FoundationModel;
  readonly storeys: readonly StoreyModel[];
}

export const BUILDING_STRUCTURE_CHANGED_EVENT = 'smartbarn:building-structure-changed';
const STORAGE_KEY = 'smartbarn.building-structure.v1';

export const DEFAULT_BUILDING_STRUCTURE: BuildingStructureModel = {
  version: 1,
  foundation: { baseElevationMm: -600, heightMm: 600 },
  storeys: [{ id: 'storey-1', name: 'Этаж 1', baseElevationMm: 0, heightMm: 3000 }],
};

const numberInRange = (value: unknown, fallback: number, min: number, max: number): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, Math.round(numeric))) : fallback;
};

export function storeyTopElevationMm(storey: StoreyModel): number {
  return storey.baseElevationMm + storey.heightMm;
}

export function roofBaseElevationMm(structure: BuildingStructureModel): number {
  const last = structure.storeys.at(-1);
  return last ? storeyTopElevationMm(last) : structure.foundation.baseElevationMm + structure.foundation.heightMm;
}

export function normalizeBuildingStructure(value: unknown): BuildingStructureModel {
  if (!value || typeof value !== 'object') return DEFAULT_BUILDING_STRUCTURE;
  const source = value as Partial<BuildingStructureModel>;
  const foundationSource = source.foundation ?? DEFAULT_BUILDING_STRUCTURE.foundation;
  const foundation: FoundationModel = {
    baseElevationMm: numberInRange(foundationSource.baseElevationMm, -600, -10000, 10000),
    heightMm: numberInRange(foundationSource.heightMm, 600, 100, 5000),
  };
  const rawStoreys = Array.isArray(source.storeys) ? source.storeys : DEFAULT_BUILDING_STRUCTURE.storeys;
  let nextBase = foundation.baseElevationMm + foundation.heightMm;
  const storeys = rawStoreys.map((raw, index) => {
    const sourceStorey = raw as Partial<StoreyModel>;
    const baseElevationMm = numberInRange(sourceStorey.baseElevationMm, nextBase, -10000, 50000);
    const heightMm = numberInRange(sourceStorey.heightMm, 3000, 1800, 10000);
    const storey: StoreyModel = {
      id: typeof sourceStorey.id === 'string' && sourceStorey.id ? sourceStorey.id : `storey-${index + 1}`,
      name: typeof sourceStorey.name === 'string' && sourceStorey.name.trim() ? sourceStorey.name.trim() : `Этаж ${index + 1}`,
      baseElevationMm,
      heightMm,
    };
    nextBase = storeyTopElevationMm(storey);
    return storey;
  });
  return { version: 1, foundation, storeys };
}

export function loadBuildingStructure(): BuildingStructureModel {
  if (typeof window === 'undefined') return DEFAULT_BUILDING_STRUCTURE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeBuildingStructure(JSON.parse(raw)) : DEFAULT_BUILDING_STRUCTURE;
  } catch {
    return DEFAULT_BUILDING_STRUCTURE;
  }
}

export function saveBuildingStructure(structure: BuildingStructureModel): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(structure));
  window.dispatchEvent(new CustomEvent(BUILDING_STRUCTURE_CHANGED_EVENT));
}

export function rebuildStoreyElevations(structure: BuildingStructureModel): BuildingStructureModel {
  let baseElevationMm = structure.foundation.baseElevationMm + structure.foundation.heightMm;
  const storeys = structure.storeys.map((storey) => {
    const next = { ...storey, baseElevationMm };
    baseElevationMm = storeyTopElevationMm(next);
    return next;
  });
  return { ...structure, storeys };
}
