import type { SmartBarnModel } from '@smartbarn/domain';

export interface NormalizedBimModel {
  schema: string;
  elements: unknown[];
  metadata?: Record<string, unknown>;
}

export interface BimConverter {
  toIfc(model: SmartBarnModel): Promise<ArrayBuffer>;
  fromIfc(data: ArrayBuffer): Promise<SmartBarnModel>;
}

export interface IfcAdapter {
  parse(data: ArrayBuffer): Promise<NormalizedBimModel>;
  serialize(model: NormalizedBimModel): Promise<ArrayBuffer>;
}
