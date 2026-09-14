import { ChangeDetectionStrategy, Component, computed, input, model, output, signal } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { lucideCheck, lucideChevronDown, lucideSearch, type IconCollection } from '@smartbarn/icons';
import { IconComponent, provideIcons } from './icon.component';

export interface SearchComboboxOption {
  readonly value: string;
  readonly label: string;
  readonly group?: string;
  readonly keywords?: readonly string[];
  readonly disabled?: boolean;
}

interface SearchComboboxGroup {
  readonly name: string;
  readonly options: readonly SearchComboboxOption[];
}

/**
 * SmartBarn reusable searchable single-value combobox.
 * Signal-first API, compatible with Angular Signal Forms through FormValueControl.
 * Group labels are presentation-only; only options are selectable.
 */
@Component({
  selector: 'sb-search-combobox',
  standalone: true,
  imports: [IconComponent],
  providers: provideIcons(lucideChevronDown, lucideSearch, lucideCheck),
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block min-w-0' },
  template: `
    <div class="relative" (focusout)="onFocusOut($event)">
      <button
        type="button"
        class="flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-[var(--sb-border)] bg-[var(--sb-bg)] px-3 text-left text-sm text-[var(--sb-text)] outline-none focus:border-[var(--sb-accent)] focus:ring-1 focus:ring-[var(--sb-accent)]"
        [disabled]="disabled()"
        [attr.aria-expanded]="open()"
        aria-haspopup="listbox"
        (click)="toggle()"
      >
        <span class="min-w-0 flex-1 truncate" [class.text-[var(--sb-text-muted)]]="!selected()">
          {{ selected()?.label || placeholder() }}
        </span>
        <sb-icon
          class="text-[var(--sb-text-muted)]"
          name="chevronDown"
          [collection]="iconCollection()"
          [size]="iconSize()"
          [strokeWidth]="iconStrokeWidth()"
        />
      </button>

      @if (open() && !disabled()) {
        <div
          class="absolute left-0 top-[calc(100%+4px)] z-50 w-full min-w-[280px] overflow-hidden rounded-md border border-[var(--sb-border)] bg-[var(--sb-surface)] shadow-xl"
        >
          <div class="border-b border-[var(--sb-border)] p-2">
            <div class="flex items-center gap-2 rounded-md border border-[var(--sb-border)] bg-[var(--sb-bg)] px-2 focus-within:border-[var(--sb-accent)] focus-within:ring-1 focus-within:ring-[var(--sb-accent)]">
              <sb-icon
                class="text-[var(--sb-text-muted)]"
                name="search"
                [collection]="iconCollection()"
                [size]="iconSize()"
                [strokeWidth]="iconStrokeWidth()"
              />
              <input
                #searchInput
                type="search"
                autocomplete="off"
                class="h-9 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm text-[var(--sb-text)] outline-none"
                [placeholder]="searchPlaceholder()"
                [value]="query()"
                (input)="onSearch($event)"
                (keydown.escape)="close()"
              />
            </div>
          </div>

          <div class="max-h-72 overflow-auto p-1" role="listbox">
            @if (groups().length === 0) {
              <div class="px-3 py-4 text-center text-sm text-[var(--sb-text-muted)]">{{ emptyText() }}</div>
            }
            @for (group of groups(); track group.name) {
              @if (group.name) {
                <div class="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--sb-text-muted)]" role="presentation">
                  {{ group.name }}
                </div>
              }
              @for (option of group.options; track option.value) {
                <button
                  type="button"
                  role="option"
                  class="flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left text-sm text-[var(--sb-text)] hover:bg-[var(--sb-accent-soft)] disabled:opacity-50"
                  [disabled]="option.disabled"
                  [attr.aria-selected]="value() === option.value"
                  (click)="select(option)"
                >
                  <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
                  @if (value() === option.value) {
                    <sb-icon
                      name="check"
                      [collection]="iconCollection()"
                      [size]="iconSize()"
                      [strokeWidth]="iconStrokeWidth()"
                    />
                  }
                </button>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class SearchComboboxComponent implements FormValueControl<string | null> {
  readonly options = input<readonly SearchComboboxOption[]>([]);
  readonly placeholder = input('Выберите значение');
  readonly searchPlaceholder = input('Поиск…');
  readonly emptyText = input('Ничего не найдено');
  readonly disabled = input(false);
  readonly value = model<string | null>(null);
  readonly touch = output<void>();

  /** Icon collection used by the combobox chrome. Lucide is the default SmartBarn collection. */
  readonly iconCollection = input<IconCollection>('lucide');
  /** Local icon scale. It is relative to text by default and can be overridden by consumers. */
  readonly iconSize = input<string | number>('1.25em');
  readonly iconStrokeWidth = input<number | null>(null);

  readonly open = signal(false);
  readonly query = signal('');
  readonly selected = computed(() => this.options().find((option) => option.value === this.value()) ?? null);

  readonly groups = computed<readonly SearchComboboxGroup[]>(() => {
    const search = this.normalize(this.query());
    const filtered = this.options().filter((option) => {
      if (!search) return true;
      const haystack = [option.label, option.group ?? '', ...(option.keywords ?? [])].join(' ');
      return this.normalize(haystack).includes(search);
    });

    const names: string[] = [];
    const map = new Map<string, SearchComboboxOption[]>();
    for (const option of filtered) {
      const group = option.group ?? '';
      if (!map.has(group)) {
        map.set(group, []);
        names.push(group);
      }
      map.get(group)!.push(option);
    }
    return names.map((name) => ({ name, options: map.get(name)! }));
  });

  toggle(): void {
    if (this.disabled()) return;
    this.query.set('');
    this.open.update((value) => !value);
  }

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  select(option: SearchComboboxOption): void {
    if (option.disabled) return;
    this.value.set(option.value);
    this.query.set('');
    this.open.set(false);
    this.touch.emit();
  }

  close(): void {
    if (!this.open()) return;
    this.query.set('');
    this.open.set(false);
    this.touch.emit();
  }

  onFocusOut(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement;
    const next = event.relatedTarget as Node | null;
    if (next && host.contains(next)) return;
    this.close();
  }

  focus(): void {
    this.open.set(true);
  }

  reset(): void {
    this.value.set(null);
    this.query.set('');
    this.open.set(false);
  }

  private normalize(value: string): string {
    return value.trim().toLocaleLowerCase('ru');
  }
}
