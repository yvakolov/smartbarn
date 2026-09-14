import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';

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
 * SmartBarn reusable searchable combobox primitive.
 *
 * Public API is signal-first (`input()` / `model()`) so the component can be
 * composed with Angular signal forms and application-specific wrappers.
 * Domain concepts do not belong here: callers provide flat options and an
 * optional non-selectable group label.
 *
 * The interaction model follows Spartan combobox conventions: searchable
 * input, grouped listbox, non-selectable group headings and single selection.
 */
@Component({
  selector: 'sb-search-combobox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block min-w-0' },
  template: `
    <div class="relative">
      <input
        type="text"
        role="combobox"
        autocomplete="off"
        class="w-full rounded-md border border-[var(--sb-border)] bg-[var(--sb-surface)] px-3 py-2 pr-8 text-sm text-[var(--sb-text)] outline-none focus:border-[var(--sb-accent)]"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [value]="displayValue()"
        [attr.aria-expanded]="open()"
        aria-autocomplete="list"
        (focus)="open.set(true)"
        (click)="open.set(true)"
        (input)="onSearch($event)"
        (keydown.escape)="close()"
        (keydown.arrowdown)="open.set(true)"
        (blur)="onBlur()"
      />
      <button
        type="button"
        class="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-[var(--sb-text-muted)] hover:bg-[var(--sb-gray-3)]"
        tabindex="-1"
        [disabled]="disabled()"
        (mousedown)="$event.preventDefault()"
        (click)="toggle()"
        aria-label="Открыть список"
      >⌄</button>
    </div>

    @if (open() && !disabled()) {
      <div
        class="absolute z-50 mt-1 max-h-72 w-full min-w-[260px] overflow-auto rounded-md border border-[var(--sb-border)] bg-[var(--sb-surface)] p-1 shadow-xl"
        role="listbox"
      >
        @if (groups().length === 0) {
          <div class="px-3 py-2 text-sm text-[var(--sb-text-muted)]">{{ emptyText() }}</div>
        }
        @for (group of groups(); track group.name) {
          @if (group.name) {
            <div class="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--sb-text-muted)]">
              {{ group.name }}
            </div>
          }
          @for (option of group.options; track option.value) {
            <button
              type="button"
              role="option"
              class="flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left text-sm hover:bg-[var(--sb-accent-soft)] disabled:opacity-50"
              [disabled]="option.disabled"
              [attr.aria-selected]="value() === option.value"
              (mousedown)="$event.preventDefault()"
              (click)="select(option)"
            >
              <span class="truncate">{{ option.label }}</span>
              @if (value() === option.value) { <span aria-hidden="true">✓</span> }
            </button>
          }
        }
      </div>
    }
  `,
})
export class SearchComboboxComponent {
  readonly options = input<readonly SearchComboboxOption[]>([]);
  readonly placeholder = input('Выберите значение');
  readonly emptyText = input('Ничего не найдено');
  readonly disabled = input(false);
  readonly value = model<string | null>(null);

  readonly open = signal(false);
  readonly query = signal('');

  readonly selected = computed(() => this.options().find((option) => option.value === this.value()) ?? null);
  readonly displayValue = computed(() => (this.open() && this.query() ? this.query() : this.selected()?.label ?? this.query()));

  readonly groups = computed<readonly SearchComboboxGroup[]>(() => {
    const search = this.query().trim().toLocaleLowerCase('ru');
    const filtered = this.options().filter((option) => {
      if (!search) return true;
      const haystack = [option.label, option.group ?? '', ...(option.keywords ?? [])].join(' ').toLocaleLowerCase('ru');
      return haystack.includes(search);
    });
    const names: string[] = [];
    const map = new Map<string, SearchComboboxOption[]>();
    for (const option of filtered) {
      const group = option.group ?? '';
      if (!map.has(group)) { map.set(group, []); names.push(group); }
      map.get(group)!.push(option);
    }
    return names.map((name) => ({ name, options: map.get(name)! }));
  });

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.open.set(true);
  }

  select(option: SearchComboboxOption): void {
    if (option.disabled) return;
    this.value.set(option.value);
    this.query.set('');
    this.open.set(false);
  }

  toggle(): void {
    this.query.set('');
    this.open.update((value) => !value);
  }

  close(): void {
    this.query.set('');
    this.open.set(false);
  }

  onBlur(): void {
    queueMicrotask(() => this.close());
  }
}
