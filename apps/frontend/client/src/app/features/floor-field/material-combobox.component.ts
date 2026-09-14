import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { SearchComboboxComponent, type SearchComboboxOption } from '@smartbarn/ui-kit';
import { MATERIAL_GROUPS, type MaterialRecord } from '../materials/material-catalog';

/** Desktop feature component: knows about SmartBarn materials, while the UI-kit
 * combobox remains domain-agnostic. Group headings are display-only; only
 * materials can be selected. */
@Component({
  selector: 'smartbarn-material-combobox',
  standalone: true,
  imports: [SearchComboboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sb-search-combobox
      [options]="options()"
      [placeholder]="placeholder()"
      [disabled]="disabled()"
      emptyText="Материалы не найдены"
      [(value)]="value"
    />
  `,
})
export class MaterialComboboxComponent implements FormValueControl<string | null> {
  readonly materials = input.required<readonly MaterialRecord[]>();
  readonly placeholder = input('Выберите материал');
  readonly disabled = input(false);
  readonly value = model<string | null>(null);

  readonly options = computed<readonly SearchComboboxOption[]>(() => {
    const groupNames = new Map(MATERIAL_GROUPS.map((group) => [group.id, group.name] as const));
    return this.materials().map((material) => ({
      value: material.id,
      label: material.name,
      group: groupNames.get(material.group) ?? 'Прочее',
      keywords: [material.manufacturer ?? '', material.productCode ?? '', material.group],
    }));
  });
}
