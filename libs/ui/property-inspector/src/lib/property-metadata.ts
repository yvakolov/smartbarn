export type PropertyControlType = 'number' | 'text' | 'select';

export interface PropertyOption {
  readonly value: string;
  readonly label: string;
}

export interface PropertyMetadata<T extends object = Record<string, unknown>> {
  readonly key: keyof T & string;
  readonly type: PropertyControlType;
  readonly label: string;
  readonly group?: string;
  readonly unit?: string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly readonly?: boolean;
  readonly options?: readonly PropertyOption[];
}

export interface PropertyInspectorChange<T extends object = Record<string, unknown>> {
  readonly key: keyof T & string;
  readonly value: unknown;
}
