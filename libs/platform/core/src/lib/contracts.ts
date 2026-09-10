export type SmartBarnEntityId = string;
export type SmartBarnModuleId = string;

export interface VersionedEntity {
  id: SmartBarnEntityId;
  version: number;
}

export interface ModuleCapability {
  id: string;
  description?: string;
}

export interface SmartBarnModuleManifest {
  id: SmartBarnModuleId;
  name: string;
  version: string;
  entityTypes: readonly string[];
  capabilities: readonly ModuleCapability[];
}

export interface ReferencePlane {
  id: string;
  elevationMm: number;
}

export interface PlanPosition {
  xMm: number;
  yMm: number;
}
