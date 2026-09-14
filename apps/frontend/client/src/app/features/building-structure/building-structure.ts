import { loadUnderWallsThicknessMm } from '../floor-field/floor-field.store';

export interface FoundationModel {
  readonly baseElevationMm: number;
  readonly heightMm: number;
}

export interface StoreyModel {
  readonly id: string;
  readonly name: string;
  /** Bottom of the floor layers that are under walls. */
  readonly baseElevationMm: number;
  /** Clear wall height from the floor datum (top of under-wall layers) to the wall top. */
  readonly clearanceMm: number;
  /** Under-wall floor thickness + clearance. */
  readonly heightMm: number;
}

export interface BuildingStructureModel {
  readonly version: 1;
  readonly foundation: FoundationModel;
  readonly storeys: readonly StoreyModel[];
}

export const BUILDING_STRUCTURE_CHANGED_EVENT = 'smartbarn:building-structure-changed';
const STORAGE_KEY = 'smartbarn.building-structure.v1';
const DEFAULT_CLEARANCE_MM=2800;

export const DEFAULT_BUILDING_STRUCTURE: BuildingStructureModel = {
  version: 1,
  foundation: { baseElevationMm: -600, heightMm: 600 },
  storeys: [{ id: 'storey-1', name: 'Этаж 1', baseElevationMm: -224, clearanceMm: DEFAULT_CLEARANCE_MM, heightMm: DEFAULT_CLEARANCE_MM + 224 }],
};

const numberInRange = (value: unknown, fallback: number, min: number, max: number): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, Math.round(numeric))) : fallback;
};

export function storeyFloorDatumElevationMm(storey:StoreyModel,underWallsThicknessMm=loadUnderWallsThicknessMm()):number{
  return storey.baseElevationMm+underWallsThicknessMm;
}

export function storeyTopElevationMm(storey: StoreyModel): number {
  return storey.baseElevationMm + storey.heightMm;
}

export function roofBaseElevationMm(structure: BuildingStructureModel): number {
  const last = structure.storeys.at(-1);
  return last ? storeyTopElevationMm(last) : 0;
}

export function normalizeBuildingStructure(value: unknown): BuildingStructureModel {
  if (!value || typeof value !== 'object') return rebuildStoreyElevations(DEFAULT_BUILDING_STRUCTURE);
  const source = value as Partial<BuildingStructureModel>;
  const foundationSource = source.foundation ?? DEFAULT_BUILDING_STRUCTURE.foundation;
  const foundation: FoundationModel = {
    baseElevationMm: numberInRange(foundationSource.baseElevationMm, -600, -10000, 10000),
    heightMm: numberInRange(foundationSource.heightMm, 600, 100, 5000),
  };
  const underWallsThicknessMm=loadUnderWallsThicknessMm();
  const rawStoreys = Array.isArray(source.storeys) ? source.storeys : DEFAULT_BUILDING_STRUCTURE.storeys;
  let nextBase = -underWallsThicknessMm;
  const storeys = rawStoreys.map((raw, index) => {
    const sourceStorey = raw as Partial<StoreyModel>;
    const legacyHeightMm=numberInRange(sourceStorey.heightMm, DEFAULT_CLEARANCE_MM+underWallsThicknessMm, 1800, 10000);
    const clearanceMm=numberInRange(sourceStorey.clearanceMm, Math.max(1800,legacyHeightMm-underWallsThicknessMm), 1800, 10000);
    const heightMm=clearanceMm+underWallsThicknessMm;
    const storey: StoreyModel = {
      id: typeof sourceStorey.id === 'string' && sourceStorey.id ? sourceStorey.id : `storey-${index + 1}`,
      name: typeof sourceStorey.name === 'string' && sourceStorey.name.trim() ? sourceStorey.name.trim() : `Этаж ${index + 1}`,
      baseElevationMm:nextBase,
      clearanceMm,
      heightMm,
    };
    nextBase = storeyTopElevationMm(storey);
    return storey;
  });
  return { version: 1, foundation, storeys };
}

export function loadBuildingStructure(): BuildingStructureModel {
  if (typeof window === 'undefined') return rebuildStoreyElevations(DEFAULT_BUILDING_STRUCTURE);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeBuildingStructure(JSON.parse(raw)) : rebuildStoreyElevations(DEFAULT_BUILDING_STRUCTURE);
  } catch {
    return rebuildStoreyElevations(DEFAULT_BUILDING_STRUCTURE);
  }
}

export function saveBuildingStructure(structure: BuildingStructureModel): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(structure));
  window.dispatchEvent(new CustomEvent(BUILDING_STRUCTURE_CHANGED_EVENT));
}

export function rebuildStoreyElevations(structure: BuildingStructureModel): BuildingStructureModel {
  const underWallsThicknessMm=loadUnderWallsThicknessMm();
  // The first-storey datum 0.000 is the top of the highest layer marked "under walls".
  // Therefore the bottom of the first storey is exactly one under-wall assembly thickness below zero.
  let baseElevationMm = -underWallsThicknessMm;
  const storeys = structure.storeys.map((storey) => {
    const heightMm=storey.clearanceMm+underWallsThicknessMm;
    const next = { ...storey, baseElevationMm, heightMm };
    // For upper storeys, the previous wall top is the lower boundary of the next storey.
    baseElevationMm = storeyTopElevationMm(next);
    return next;
  });
  return { ...structure, storeys };
}
