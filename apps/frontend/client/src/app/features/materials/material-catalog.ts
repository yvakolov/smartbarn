export type MaterialGroup = 'wood' | 'sheet' | 'insulation' | 'concrete' | 'metal' | 'membrane' | 'finish' | 'covering' | 'fastener' | 'other';

export interface MaterialRecord {
  readonly id: string;
  readonly group: MaterialGroup;
  readonly name: string;
  readonly manufacturer?: string;
  readonly productCode?: string;
  readonly description?: string;
  readonly defaultThicknessMm?: number;
  readonly densityKgM3?: number;
  readonly thermalConductivityWMK?: number;
  readonly specificHeatJKgK?: number;
  readonly vaporResistanceFactor?: number;
  readonly compressiveStrengthMPa?: number;
  readonly elasticModulusMPa?: number;
  readonly color: string;
}

export const MATERIAL_GROUPS: ReadonlyArray<{ id: MaterialGroup; name: string }> = [
  { id: 'wood', name: 'Древесина' }, { id: 'sheet', name: 'Листовые материалы' },
  { id: 'insulation', name: 'Теплоизоляция' }, { id: 'concrete', name: 'Бетон / растворы' },
  { id: 'metal', name: 'Металл' }, { id: 'membrane', name: 'Мембраны / плёнки' },
  { id: 'finish', name: 'Отделочные материалы' }, { id: 'covering', name: 'Покрытие' },
  { id: 'fastener', name: 'Крепёж' }, { id: 'other', name: 'Прочее' },
];

export const DEFAULT_MATERIALS: readonly MaterialRecord[] = [
  { id: 'osb-3', group: 'sheet', name: 'OSB-3', defaultThicknessMm: 12, densityKgM3: 650, thermalConductivityWMK: 0.13, color: '#f5d77a' },
  { id: 'mineral-wool', group: 'insulation', name: 'Минеральная вата', defaultThicknessMm: 200, densityKgM3: 40, thermalConductivityWMK: 0.038, color: '#e8c66a' },
  { id: 'structural-timber', group: 'wood', name: 'Конструкционная древесина', defaultThicknessMm: 200, densityKgM3: 500, thermalConductivityWMK: 0.13, color: '#e58b2a' },
  { id: 'cement-screed', group: 'concrete', name: 'Цементная стяжка', defaultThicknessMm: 60, densityKgM3: 2000, thermalConductivityWMK: 1.4, color: '#aaa9a5' },
  { id: 'porcelain-stoneware', group: 'covering', name: 'Керамогранит', defaultThicknessMm: 10, color: '#c9c4ba' },
  { id: 'quartz-vinyl', group: 'covering', name: 'Кварцвинил', defaultThicknessMm: 4, color: '#b99b78' },
  { id: 'laminate', group: 'covering', name: 'Ламинат', defaultThicknessMm: 8, color: '#c99f68' },
];

export const MATERIAL_CATALOG_CHANGED_EVENT = 'smartbarn:material-catalog-changed';
const STORAGE_KEY = 'smartbarn.material-catalog.v1';
export function loadMaterialCatalog(): MaterialRecord[] {
  if (typeof window === 'undefined') return [...DEFAULT_MATERIALS];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_MATERIALS];
    const data = JSON.parse(raw);
    if (!Array.isArray(data?.materials)) return [...DEFAULT_MATERIALS];
    const stored = data.materials as MaterialRecord[];
    const storedIds = new Set(stored.map((material) => material.id));
    return [...stored, ...DEFAULT_MATERIALS.filter((material) => !storedIds.has(material.id))];
  } catch { return [...DEFAULT_MATERIALS]; }
}
export function saveMaterialCatalog(materials: readonly MaterialRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, materials }));
  window.dispatchEvent(new CustomEvent(MATERIAL_CATALOG_CHANGED_EVENT));
}
export function materialById(id: string | undefined): MaterialRecord | undefined { return loadMaterialCatalog().find((item) => item.id === id); }
