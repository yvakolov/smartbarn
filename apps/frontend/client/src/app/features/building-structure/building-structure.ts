import { loadUnderWallsThicknessMm } from '../floor-field/floor-field.store';

export interface FoundationModel {
  readonly type: 'screw-pile-timber-grillage';
  /** Bottom elevation of the 200x200 timber grillage. */
  readonly baseElevationMm: number;
  /** Timber grillage height. Default beam section is 200x200 mm. */
  readonly heightMm: number;
  readonly beamWidthMm: number;
  readonly pileDiameterMm: number;
  readonly pileLengthMm: number;
  /** Distance from ground level to the lower face of the grillage. */
  readonly groundClearanceMm: number;
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
  readonly version: 2;
  readonly foundation: FoundationModel;
  readonly storeys: readonly StoreyModel[];
}

export const BUILDING_STRUCTURE_CHANGED_EVENT = 'smartbarn:building-structure-changed';
const STORAGE_KEY = 'smartbarn.building-structure.v1';
const DEFAULT_CLEARANCE_MM=2800;
const DEFAULT_FOUNDATION_HEIGHT_MM=200;
const DEFAULT_BEAM_WIDTH_MM=200;
const DEFAULT_PILE_DIAMETER_MM=108;
const DEFAULT_PILE_LENGTH_MM=3000;
const DEFAULT_GROUND_CLEARANCE_MM=400;

export const DEFAULT_BUILDING_STRUCTURE: BuildingStructureModel = {
  version: 2,
  foundation: {
    type:'screw-pile-timber-grillage',
    baseElevationMm:-424,
    heightMm:DEFAULT_FOUNDATION_HEIGHT_MM,
    beamWidthMm:DEFAULT_BEAM_WIDTH_MM,
    pileDiameterMm:DEFAULT_PILE_DIAMETER_MM,
    pileLengthMm:DEFAULT_PILE_LENGTH_MM,
    groundClearanceMm:DEFAULT_GROUND_CLEARANCE_MM,
  },
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
  const heightMm=numberInRange(foundationSource.heightMm,DEFAULT_FOUNDATION_HEIGHT_MM,100,1000);
  const foundation:FoundationModel={
    type:'screw-pile-timber-grillage',
    heightMm,
    beamWidthMm:numberInRange(foundationSource.beamWidthMm,DEFAULT_BEAM_WIDTH_MM,100,500),
    pileDiameterMm:numberInRange(foundationSource.pileDiameterMm,DEFAULT_PILE_DIAMETER_MM,57,325),
    pileLengthMm:numberInRange(foundationSource.pileLengthMm,DEFAULT_PILE_LENGTH_MM,1000,12000),
    groundClearanceMm:numberInRange(foundationSource.groundClearanceMm,DEFAULT_GROUND_CLEARANCE_MM,0,400),
    baseElevationMm:-firstThickness-heightMm,
  };
  return { version: 2, foundation, storeys };
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
