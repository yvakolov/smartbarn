import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

export type FloorFieldViewPreference = 'geometry' | 'layers' | '3d';
export type NavigationModePreference = 'trackpad' | 'mouse';
export interface FloorFieldCameraPreference {
  readonly position: [number, number, number];
  readonly target: [number, number, number];
  readonly zoom: number;
}

interface FloorFieldPreferencesState {
  readonly userId: string;
  readonly activeView: FloorFieldViewPreference;
  readonly inspectorOpen: boolean;
  readonly gridStepMm: number;
  readonly snapToGrid: boolean;
  readonly show3dGrid: boolean;
  readonly navigationMode: NavigationModePreference;
  readonly camera: FloorFieldCameraPreference | null;
  readonly hiddenLayerIds: readonly number[];
}

const DEFAULT_USER_ID = 'local-user';
const defaults = (userId = DEFAULT_USER_ID): FloorFieldPreferencesState => ({
  userId,
  activeView: 'geometry',
  inspectorOpen: true,
  gridStepMm: 100,
  snapToGrid: true,
  show3dGrid: false,
  navigationMode: 'trackpad',
  camera: null,
  hiddenLayerIds: [],
});

function storageKey(userId: string): string {
  return `smartbarn.user-settings.${userId}.floor-field.v1`;
}

function read(userId: string): FloorFieldPreferencesState {
  const fallback = defaults(userId);
  if (typeof window === 'undefined') return fallback;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey(userId)) ?? '{}') as Partial<FloorFieldPreferencesState>;
    return {
      ...fallback,
      ...parsed,
      userId,
      hiddenLayerIds: Array.isArray(parsed.hiddenLayerIds) ? parsed.hiddenLayerIds.filter(Number.isFinite) : [],
      camera: parsed.camera ?? null,
    };
  } catch {
    return fallback;
  }
}

export const FloorFieldPreferencesStore = signalStore(
  { providedIn: 'root' },
  withState(defaults()),
  withMethods((store) => {
    const persist = (): void => {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(storageKey(store.userId()), JSON.stringify({
        activeView: store.activeView(), inspectorOpen: store.inspectorOpen(), gridStepMm: store.gridStepMm(),
        snapToGrid: store.snapToGrid(), show3dGrid: store.show3dGrid(), navigationMode: store.navigationMode(),
        camera: store.camera(), hiddenLayerIds: store.hiddenLayerIds(),
      }));
    };
    const update = (patch: Partial<FloorFieldPreferencesState>): void => { patchState(store, patch); persist(); };
    return {
      initialize(userId = DEFAULT_USER_ID): void { patchState(store, read(userId)); },
      setActiveView(activeView: FloorFieldViewPreference): void { update({ activeView }); },
      setInspectorOpen(inspectorOpen: boolean): void { update({ inspectorOpen }); },
      setGridStepMm(gridStepMm: number): void { update({ gridStepMm }); },
      setSnapToGrid(snapToGrid: boolean): void { update({ snapToGrid }); },
      setShow3dGrid(show3dGrid: boolean): void { update({ show3dGrid }); },
      setNavigationMode(navigationMode: NavigationModePreference): void { update({ navigationMode }); },
      setCamera(camera: FloorFieldCameraPreference): void { update({ camera }); },
      setLayerVisible(id: number, visible: boolean): void {
        const hidden = new Set(store.hiddenLayerIds()); visible ? hidden.delete(id) : hidden.add(id); update({ hiddenLayerIds: [...hidden] });
      },
      showAllLayers(): void { update({ hiddenLayerIds: [] }); },
      hideAllLayers(ids: readonly number[]): void { update({ hiddenLayerIds: [...ids] }); },
      resetWorkspace(): void { const userId = store.userId(); patchState(store, defaults(userId)); persist(); },
    };
  }),
);
