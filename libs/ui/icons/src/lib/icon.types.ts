/** Supported SmartBarn icon collections. */
export type IconCollection = 'lucide' | 'bootstrap' | 'hero';

/**
 * Tree-shakeable normalized SVG icon definition.
 *
 * Icon source packages are compile-time sources only. Runtime consumers register
 * only the definitions they actually use, so unused icons and collections do not
 * enter the application bundle.
 */
export interface IconDefinition {
  readonly collection: IconCollection;
  readonly name: string;
  readonly viewBox: string;
  readonly paths: readonly string[];
  readonly fill?: 'none' | 'currentColor';
  readonly stroke?: 'none' | 'currentColor';
  readonly strokeWidth?: number;
  readonly strokeLinecap?: 'butt' | 'round' | 'square';
  readonly strokeLinejoin?: 'miter' | 'round' | 'bevel';
}
