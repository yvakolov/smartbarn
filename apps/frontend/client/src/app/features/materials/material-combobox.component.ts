import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { SearchComboboxComponent, type SearchComboboxOption } from '@smartbarn/ui-kit';
import { MATERIAL_GROUPS, type MaterialRecord } from './material-catalog';

/**
 * Desktop application component for choosing a material from the catalog.
 *
 * This component owns SmartBarn material semantics. The shared UI kit only
 * knows about generic combobox options. Group headings are deliberately not
 * selectable; only MaterialRecord ids are emitted through the value model.
 */
@Component({
  selector: 'smartbarn-material-combobox',
  standalone: true,
  imports: [SearchComboboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sb-search-combobox
      class="block w-full"
      [options]="options()"
      [placeholder]="placeholder()"
      [disabled]="disabled()"
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
