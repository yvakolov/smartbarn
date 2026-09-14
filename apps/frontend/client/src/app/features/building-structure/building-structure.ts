import { loadUnderWallsThicknessMm } from '../floor-field/floor-field.store';

export interface FoundationModel {
  readonly baseElevationMm: number;
  readonly heightMm: number;
}

export interface StoreyModel {
  readonly id: string;
  readonly name: string;
  /** Bottom of this storey's floor layers that are under walls. */
  readonly baseElevationMm: number;
  /** Clear wall height from this storey's floor datum to the wall top. */
  readonly clearanceMm: number;
  /** This storey's under-wall floor thickness + clearance. */
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
const DEFAULT_FOUNDATION_HEIGHT_MM=600;

export const DEFAULT_BUILDING_STRUCTURE: BuildingStructureModel = {
  version: 1,
  foundation: { baseElevationMm: -824, heightMm: DEFAULT_FOUNDATION_HEIGHT_MM },
  storeys: [{ id: 'storey-1', name: 'Этаж 1', baseElevationMm: -224, clearanceMm: DEFAULT_CLEARANCE_MM, heightMm: DEFAULT_CLEARANCE_MM + 224 }],
};

const numberInRange = (value: unknown, fallback: number, min: number, max: number): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, Math.round(numeric))) : fallback;
};

export function storeyFloorDatumElevationMm(storey:StoreyModel):number{
  return storey.baseElevationMm+loadUnderWallsThicknessMm(storey.id);
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
  const foundationHeightMm=numberInRange(foundationSource.heightMm, DEFAULT_FOUNDATION_HEIGHT_MM, 100, 5000);
  const rawStoreys = Array.isArray(source.storeys) ? source.storeys : DEFAULT_BUILDING_STRUCTURE.storeys;
  let nextBase = 0;
  const storeys = rawStoreys.map((raw, index) => {
    const sourceStorey = raw as Partial<StoreyModel>;
    const id=typeof sourceStorey.id === 'string' && sourceStorey.id ? sourceStorey.id : `storey-${index + 1}`;
    const underWallsThicknessMm=loadUnderWallsThicknessMm(id);
    if(index===0)nextBase=-underWallsThicknessMm;
    const legacyHeightMm=numberInRange(sourceStorey.heightMm, DEFAULT_CLEARANCE_MM+underWallsThicknessMm, 1800, 10000);
    const clearanceMm=numberInRange(sourceStorey.clearanceMm, Math.max(1800,legacyHeightMm-underWallsThicknessMm), 1800, 10000);
    const heightMm=clearanceMm+underWallsThicknessMm;
    const storey: StoreyModel = {
      id,
      name: typeof sourceStorey.name === 'string' && sourceStorey.name.trim() ? sourceStorey.name.trim() : `Этаж ${index + 1}`,
      baseElevationMm:nextBase,
      clearanceMm,
      heightMm,
    };
    nextBase = storeyTopElevationMm(storey);
    return storey;
  });
  const firstThickness=storeys.length?loadUnderWallsThicknessMm(storeys[0].id):0;
  const foundation: FoundationModel = {heightMm:foundationHeightMm,baseElevationMm:-firstThickness-foundationHeightMm};
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
  const firstStorey=structure.storeys[0];
  const firstThickness=firstStorey?loadUnderWallsThicknessMm(firstStorey.id):0;
  const foundation={...structure.foundation,baseElevationMm:-firstThickness-structure.foundation.heightMm};
  let baseElevationMm = -firstThickness;
  const storeys = structure.storeys.map((storey) => {
    const underWallsThicknessMm=loadUnderWallsThicknessMm(storey.id);
    const heightMm=storey.clearanceMm+underWallsThicknessMm;
    const next = { ...storey, baseElevationMm, heightMm };
    baseElevationMm = storeyTopElevationMm(next);
    return next;
  });
  return { ...structure, foundation, storeys };
}
