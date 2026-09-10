import type { CommandDescriptor } from '@smartbarn/platform-core';
import { floorFieldCommandTokens } from './commands';

/** Command metadata consumed by menus, toolbars and future command palettes. */
export const floorFieldCommandDescriptors: readonly CommandDescriptor[] = [
  {
    token: floorFieldCommandTokens.resize,
    titleKey: 'floorField.commands.resize',
    category: 'floorField',
    group: 'geometry',
    order: 10,
  },
  {
    token: floorFieldCommandTokens.addLayer,
    titleKey: 'floorField.commands.addLayer',
    category: 'floorField',
    group: 'layers',
    order: 20,
  },
  {
    token: floorFieldCommandTokens.removeLayer,
    titleKey: 'floorField.commands.removeLayer',
    category: 'floorField',
    group: 'layers',
    order: 30,
    destructive: true,
  },
  {
    token: floorFieldCommandTokens.moveLayer,
    titleKey: 'floorField.commands.moveLayer',
    category: 'floorField',
    group: 'layers',
    order: 40,
  },
];
