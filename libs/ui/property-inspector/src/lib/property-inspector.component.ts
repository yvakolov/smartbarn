import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SearchComboboxComponent } from '@smartbarn/ui-kit';
import type { PropertyInspectorChange, PropertyMetadata } from './property-metadata';

@Component({
  selector: 'sb-property-inspector',
  standalone: true,
  imports: [SearchComboboxComponent],
  templateUrl: './property-inspector.component.html',
  styleUrl: './property-inspector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyInspectorComponent<T extends object = Record<string, unknown>> {
  readonly title = input('Свойства');
  readonly value = input.required<T>();
  readonly metadata = input.required<readonly PropertyMetadata<T>[]>();
  readonly propertyChange = output<PropertyInspectorChange<T>>();

  protected read(key: keyof T & string): unknown {
    return this.value()[key];
  }

  protected updateNumber(property: PropertyMetadata<T>, event: Event): void {
    const raw = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(raw)) return;
    const min = property.min ?? -Number.MAX_SAFE_INTEGER;
    const max = property.max ?? Number.MAX_SAFE_INTEGER;
    this.propertyChange.emit({ key: property.key, value: Math.min(max, Math.max(min, raw)) });
  }

  protected updateText(property: PropertyMetadata<T>, event: Event): void {
    this.propertyChange.emit({ key: property.key, value: (event.target as HTMLInputElement).value });
  }

  protected updateSelect(property: PropertyMetadata<T>, value: string | null): void {
    if (value !== null) this.propertyChange.emit({ key: property.key, value });
  }

  protected optionLabel(property: PropertyMetadata<T>, value: unknown): string {
    return property.options?.find(option => option.value === value)?.label ?? String(value ?? '');
  }
}
