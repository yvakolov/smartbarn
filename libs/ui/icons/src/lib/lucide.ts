import type { IconDefinition } from './icon.types';

const lucide = (
  name: string,
  paths: readonly string[],
  strokeWidth = 2,
): IconDefinition => ({
  collection: 'lucide',
  name,
  viewBox: '0 0 24 24',
  paths,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

/** Lucide chevron-down icon. */
export const lucideChevronDown = lucide('chevronDown', ['m6 9 6 6 6-6']);

/** Lucide chevron-up icon. */
export const lucideChevronUp = lucide('chevronUp', ['m18 15-6-6-6 6']);

/** Lucide chevron-left icon. */
export const lucideChevronLeft = lucide('chevronLeft', ['m15 18-6-6 6-6']);

/** Lucide chevron-right icon. */
export const lucideChevronRight = lucide('chevronRight', ['m9 18 6-6-6-6']);

/** Lucide search icon. */
export const lucideSearch = lucide('search', [
  'M21 21l-4.35-4.35',
  'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z',
]);

/** Lucide check icon. */
export const lucideCheck = lucide('check', ['m20 6-11 11-5-5']);

/** Lucide menu icon. */
export const lucideMenu = lucide('menu', ['M4 6h16', 'M4 12h16', 'M4 18h16']);

/** Lucide house icon. */
export const lucideHouse = lucide('house', [
  'm3 11 9-8 9 8',
  'M5 10v10h14V10',
  'M9 20v-6h6v6',
]);

/** Lucide library icon. */
export const lucideLibrary = lucide('library', [
  'm16 6 4 14',
  'M12 6v14',
  'M8 8v12',
  'M4 4v16',
]);

/** Lucide arrow-left-right icon. */
export const lucideArrowLeftRight = lucide('arrowLeftRight', [
  'M8 3 4 7l4 4',
  'M4 7h16',
  'm16 14 4-4-4-4',
  'M20 17H4',
]);

/** Lucide settings icon. */
export const lucideSettings = lucide('settings', [
  'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.09a2 2 0 0 1 1 1.74v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z',
  'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
]);

/** Lucide panel-left icon. */
export const lucidePanelLeft = lucide('panelLeft', [
  'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z',
  'M9 3v18',
]);

/** Lucide panel-right icon. */
export const lucidePanelRight = lucide('panelRight', [
  'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z',
  'M15 3v18',
]);

/** Lucide plus icon. */
export const lucidePlus = lucide('plus', ['M12 5v14', 'M5 12h14']);

/** Lucide x icon. */
export const lucideX = lucide('x', ['M18 6 6 18', 'm6 6 12 12']);

/** Lucide rotate-ccw icon. */
export const lucideRotateCcw = lucide('rotateCcw', [
  'M3 12a9 9 0 1 0 3-6.7L3 8',
  'M3 3v5h5',
]);

/** Lucide rotate-cw icon. */
export const lucideRotateCw = lucide('rotateCw', [
  'M21 12a9 9 0 1 1-3-6.7L21 8',
  'M21 3v5h-5',
]);
