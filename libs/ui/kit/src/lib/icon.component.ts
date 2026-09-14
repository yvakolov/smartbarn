import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  Provider,
  computed,
  inject,
  input,
} from '@angular/core';
import type { IconCollection, IconDefinition } from '@smartbarn/icons';

const ICON_DEFINITION = new InjectionToken<IconDefinition>('SMARTBARN_ICON_DEFINITION');

/**
 * Registers only the icon definitions required by a component or lazy feature.
 *
 * Because definitions are imported explicitly at the call site, normal ESM
 * tree-shaking removes every unused icon and unused collection from the bundle.
 */
export function provideIcons(...icons: readonly IconDefinition[]): Provider[] {
  return icons.map((icon) => ({ provide: ICON_DEFINITION, useValue: icon, multi: true }));
}

/**
 * Shared SmartBarn SVG icon primitive.
 *
 * The default size is `1em`, so an icon follows the surrounding font size just
 * like a font glyph. `size` changes both dimensions; `width` and `height` can
 * override them independently. Color inherits through `currentColor` unless an
 * explicit `color` input is provided.
 */
@Component({
  selector: 'sb-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex shrink-0 items-center justify-center align-[-0.125em] leading-none',
    '[style.width]': 'resolvedWidth()',
    '[style.height]': 'resolvedHeight()',
    '[style.color]': 'color()',
  },
  template: `
    @if (definition(); as icon) {
      <svg
        width="100%"
        height="100%"
        [attr.viewBox]="icon.viewBox"
        [attr.fill]="icon.fill ?? 'none'"
        [attr.stroke]="icon.stroke ?? 'none'"
        [attr.stroke-width]="strokeWidth() ?? icon.strokeWidth ?? null"
        [attr.stroke-linecap]="icon.strokeLinecap ?? null"
        [attr.stroke-linejoin]="icon.strokeLinejoin ?? null"
        [attr.aria-hidden]="ariaLabel() ? null : 'true'"
        [attr.aria-label]="ariaLabel() || null"
        [attr.role]="ariaLabel() ? 'img' : null"
        focusable="false"
      >
        @for (path of icon.paths; track path) {
          <path [attr.d]="path" />
        }
      </svg>
    }
  `,
})
export class IconComponent {
  private readonly registeredIcons =
    (inject(ICON_DEFINITION, { optional: true }) as readonly IconDefinition[] | null) ?? [];

  readonly name = input.required<string>();
  readonly collection = input<IconCollection>('lucide');
  readonly size = input<string | number>('1em');
  readonly width = input<string | number | null>(null);
  readonly height = input<string | number | null>(null);
  readonly color = input('currentColor');
  readonly strokeWidth = input<number | null>(null);
  readonly ariaLabel = input<string | null>(null);

  readonly definition = computed(
    () =>
      this.registeredIcons.find(
        (icon) => icon.collection === this.collection() && icon.name === this.name(),
      ) ?? null,
  );

  readonly resolvedWidth = computed(() => this.toCssSize(this.width() ?? this.size()));
  readonly resolvedHeight = computed(() => this.toCssSize(this.height() ?? this.size()));

  private toCssSize(value: string | number): string {
    return typeof value === 'number' ? `${value}px` : value;
  }
}
