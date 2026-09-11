import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

export interface FloorLayer {
  readonly id: number;
  readonly kind: string;
  readonly name: string;
  readonly thicknessMm: number;
  readonly color: string;
}

type FloorFieldStoreStatus = 'idle' | 'ready' | 'error';

interface FloorFieldState {
  readonly lengthMm: number;
  readonly widthMm: number;
  readonly elevationMm: number;
  readonly layers: readonly FloorLayer[];
  readonly status: FloorFieldStoreStatus;
}

interface PersistedFloorFieldState {
  readonly version: 1;
  readonly lengthMm: number;
  readonly widthMm: number;
  readonly elevationMm: number;
  readonly layers: readonly FloorLayer[];
}

const STORAGE_KEY = 'smartbarn.floor-field.v1';
const MIN_SIZE_MM = 500;
const MAX_SIZE_MM = 50_000;

const DEFAULT_LAYERS: readonly FloorLayer[] = [
  { id: 1, kind: 'osb', name: 'OSB верхний', thicknessMm: 12, color: '#f5d77a' },
  { id: 2, kind: 'structure', name: 'Балки + теплоизоляция', thicknessMm: 200, color: '#e58b2a' },
  { id: 3, kind: 'osb', name: 'OSB нижний', thicknessMm: 12, color: '#f5d77a' },
];

const initialState: FloorFieldState = {
  lengthMm: 9_000,
  widthMm: 6_000,
  elevationMm: 0,
  layers: DEFAULT_LAYERS,
  status: 'idle',
};

function clampInteger(value: unknown, fallback: number, min: number, max: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : fallback;
}

function normalizeLayer(value: unknown): FloorLayer | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const layer = value as Partial<FloorLayer>;
  const id = clampInteger(layer.id, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!id) return undefined;
  return {
    id,
    kind: typeof layer.kind === 'string' && layer.kind ? layer.kind : 'custom',
    name: typeof layer.name === 'string' && layer.name ? layer.name : 'Слой',
    thicknessMm: clampInteger(layer.thicknessMm, 20, 1, 2_000),
    color: typeof layer.color === 'string' && layer.color ? layer.color : '#8ab4f8',
  };
}

function loadPersistedState(): Partial<FloorFieldState> | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return undefined;
  const parsed = JSON.parse(raw) as Partial<PersistedFloorFieldState>;
  if (parsed.version !== 1) return undefined;
  const layers = Array.isArray(parsed.layers)
    ? parsed.layers.map(normalizeLayer).filter((layer): layer is FloorLayer => layer !== undefined)
    : [...DEFAULT_LAYERS];
  return {
    lengthMm: clampInteger(parsed.lengthMm, initialState.lengthMm, MIN_SIZE_MM, MAX_SIZE_MM),
    widthMm: clampInteger(parsed.widthMm, initialState.widthMm, MIN_SIZE_MM, MAX_SIZE_MM),
    elevationMm: clampInteger(parsed.elevationMm, initialState.elevationMm, -10_000, 50_000),
    layers: layers.length ? layers : [...DEFAULT_LAYERS],
  };
}

export const FloorFieldStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ layers }) => ({
    totalLayerThicknessMm: computed(() => layers().reduce((sum, layer) => sum + layer.thicknessMm, 0)),
  })),
  withMethods((store) => {
    const persist = (): void => {
      if (typeof window === 'undefined') return;
      const state: PersistedFloorFieldState = {
        version: 1,
        lengthMm: store.lengthMm(),
        widthMm: store.widthMm(),
        elevationMm: store.elevationMm(),
        layers: store.layers(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    };

    const update = (state: Partial<FloorFieldState>): void => {
      patchState(store, state);
      persist();
    };

    return {
      initialize(): void {
        if (store.status() !== 'idle') return;
        try {
          const persisted = loadPersistedState();
          patchState(store, persisted ?? {}, { status: 'ready' });
          if (!persisted) persist();
        } catch {
          patchState(store, { status: 'error' });
        }
      },
      setLength(lengthMm: number): void {
        update({ lengthMm: clampInteger(lengthMm, store.lengthMm(), MIN_SIZE_MM, MAX_SIZE_MM) });
      },
      setWidth(widthMm: number): void {
        update({ widthMm: clampInteger(widthMm, store.widthMm(), MIN_SIZE_MM, MAX_SIZE_MM) });
      },
      setElevation(elevationMm: number): void {
        update({ elevationMm: clampInteger(elevationMm, store.elevationMm(), -10_000, 50_000) });
      },
      swapDimensions(): void {
        update({ lengthMm: store.widthMm(), widthMm: store.lengthMm() });
      },
      resetGeometry(): void {
        update({ lengthMm: initialState.lengthMm, widthMm: initialState.widthMm, elevationMm: initialState.elevationMm });
      },
      addLayer(position: 'top' | 'bottom'): void {
        const nextId = Math.max(0, ...store.layers().map((layer) => layer.id)) + 1;
        const layer: FloorLayer = { id: nextId, kind: 'custom', name: 'Новый слой', thicknessMm: 20, color: '#8ab4f8' };
        update({ layers: position === 'top' ? [layer, ...store.layers()] : [...store.layers(), layer] });
      },
      removeLayer(id: number): void {
        update({ layers: store.layers().filter((layer) => layer.id !== id) });
      },
      updateLayer(id: number, patch: Partial<Pick<FloorLayer, 'name' | 'color' | 'thicknessMm'>>): void {
        update({
          layers: store.layers().map((layer) =>
            layer.id === id
              ? {
                  ...layer,
                  ...patch,
                  thicknessMm:
                    patch.thicknessMm === undefined
                      ? layer.thicknessMm
                      : clampInteger(patch.thicknessMm, layer.thicknessMm, 1, 2_000),
                }
              : layer,
          ),
        });
      },
      reorderLayers(sourceId: number, targetId: number, position: 'before' | 'after'): void {
        if (sourceId === targetId) return;
        const layers = [...store.layers()];
        const sourceIndex = layers.findIndex((layer) => layer.id === sourceId);
        let targetIndex = layers.findIndex((layer) => layer.id === targetId);
        if (sourceIndex < 0 || targetIndex < 0) return;
        const [moved] = layers.splice(sourceIndex, 1);
        if (sourceIndex < targetIndex) targetIndex--;
        layers.splice(position === 'after' ? targetIndex + 1 : targetIndex, 0, moved);
        update({ layers });
      },
    };
  }),
);
