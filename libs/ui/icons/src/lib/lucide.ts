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
  'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
  'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-2.12 2.12-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V20h-3v-.08a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06-2.12-2.12.06-.06A1.65 1.65 0 0 0 7.2 15a1.65 1.65 0 0 0-1.51-1H5.6v-3h.09A1.65 1.65 0 0 0 7.2 10a1.65 1.65 0 0 0-.33-1.82l-.06-.06L8.93 6l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V4.8h3v.08a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06 2.12 2.12-.06.06A1.65 1.65 0 0 0 19.4 10a1.65 1.65 0 0 0 1.51 1H21v3h-.09a1.65 1.65 0 0 0-1.51 1Z',
], 1.6);

/** Lucide panel-right icon. */
export const lucidePanelRight = lucide('panelRight', [
  'M3 4h18v16H3z',
  'M15 4v16',
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
