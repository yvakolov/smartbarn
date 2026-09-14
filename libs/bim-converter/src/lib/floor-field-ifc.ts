import type { FloorFieldLayer, FloorFieldModel } from '@smartbarn/floor-field';
import { validateFloorFieldModel } from '@smartbarn/floor-field';

const SMARTBARN_IFC_MARKER = 'SMARTBARN_FLOOR_FIELD=';

/** Serializes a Floor Field domain model as a minimal IFC4 STEP document. */
export function serializeFloorFieldIfc4(model: FloorFieldModel): string {
  validateFloorFieldModel(model);
  const lines: string[] = [];
  let entityId = 1;
  let guidCounter = 1;
  const nextId = (): number => entityId++;
  const guid = (): string => `0SB${String(guidCounter++).padStart(19, '0')}`;
  const add = (body: string): number => {
    const id = nextId();
    lines.push(`#${id}=${body};`);
    return id;
  };

  const person = add("IFCPERSON($,$,'SmartBarn',$,$,$,$,$)");
  const organization = add("IFCORGANIZATION($,'SmartBarn',$,$,$)");
  const personAndOrganization = add(`IFCPERSONANDORGANIZATION(#${person},#${organization},$)`);
  const application = add(`IFCAPPLICATION(#${organization},'0.1.0','SmartBarn','SMARTBARN')`);
  const ownerHistory = add(`IFCOWNERHISTORY(#${personAndOrganization},#${application},$,.ADDED.,$,$,$,0)`);
  const worldPoint = add('IFCCARTESIANPOINT((0.,0.,0.))');
  const worldAxis = add(`IFCAXIS2PLACEMENT3D(#${worldPoint},$,$)`);
  const context = add(`IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-5,#${worldAxis},$)`);
  const lengthUnit = add('IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.)');
  const units = add(`IFCUNITASSIGNMENT((#${lengthUnit}))`);
  const project = add(`IFCPROJECT('${guid()}',#${ownerHistory},'SmartBarn Project',$,$,$,$,(#${context}),#${units})`);
  const storeyPlacement = add(`IFCLOCALPLACEMENT($,#${worldAxis})`);
  const storey = add(`IFCBUILDINGSTOREY('${guid()}',#${ownerHistory},'Ground Floor',$,$,#${storeyPlacement},$,$,.ELEMENT.,${number(model.referencePlane.elevationMm)})`);
  add(`IFCRELAGGREGATES('${guid()}',#${ownerHistory},$,$,#${project},(#${storey}))`);
  const extrusionDirection = add('IFCDIRECTION((0.,0.,1.))');

  const slabs: number[] = [];
  let aboveOffset = 0;
  for (const layer of model.layersAbove) {
    const z = model.referencePlane.elevationMm + aboveOffset;
    slabs.push(addLayer(layer, z));
    aboveOffset += layer.thicknessMm;
  }

  let belowOffset = 0;
  for (const layer of model.layersBelow) {
    belowOffset += layer.thicknessMm;
    const z = model.referencePlane.elevationMm - belowOffset;
    slabs.push(addLayer(layer, z));
  }

  if (slabs.length) {
    add(`IFCRELCONTAINEDINSPATIALSTRUCTURE('${guid()}',#${ownerHistory},$,$,(${slabs.map((id) => `#${id}`).join(',')}),#${storey})`);
  }

  const embeddedModel = encodeURIComponent(JSON.stringify(model));
  return [
    'ISO-10303-21;',
    'HEADER;',
    "FILE_DESCRIPTION(('ViewDefinition [ReferenceView_V1.2]'),'2;1');",
    `FILE_NAME('smartbarn-floor-field.ifc','${new Date().toISOString()}',('SmartBarn'),('SmartBarn'),'SmartBarn','SmartBarn','');`,
    "FILE_SCHEMA(('IFC4'));",
    'ENDSEC;',
    `/* ${SMARTBARN_IFC_MARKER}${embeddedModel} */`,
    'DATA;',
    ...lines,
    'ENDSEC;',
    'END-ISO-10303-21;',
    '',
  ].join('\n');

  function addLayer(layer: FloorFieldLayer, z: number): number {
    const point = add(`IFCCARTESIANPOINT((0.,0.,${number(z)}))`);
    const axis = add(`IFCAXIS2PLACEMENT3D(#${point},$,$)`);
    const placement = add(`IFCLOCALPLACEMENT(#${storeyPlacement},#${axis})`);
    const profile = add(`IFCRECTANGLEPROFILEDEF(.AREA.,$,$,${number(model.geometry.lengthMm)},${number(model.geometry.widthMm)})`);
    const solid = add(`IFCEXTRUDEDAREASOLID(#${profile},#${worldAxis},#${extrusionDirection},${number(layer.thicknessMm)})`);
    const representation = add(`IFCSHAPEREPRESENTATION(#${context},'Body','SweptSolid',(#${solid}))`);
    const shape = add(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${representation}))`);
    const slab = add(`IFCSLAB('${guid()}',#${ownerHistory},'${escapeIfc(layer.name)}',$,'SmartBarn layer ${escapeIfc(layer.id)}',#${placement},#${shape},$,.BASESLAB.)`);
    const material = add(`IFCMATERIAL('${escapeIfc(layer.type)}',$,$)`);
    const materialLayer = add(`IFCMATERIALLAYER(#${material},${number(layer.thicknessMm)},$,$,'${escapeIfc(layer.name)}',$,$)`);
    const materialSet = add(`IFCMATERIALLAYERSET((#${materialLayer}),'${escapeIfc(layer.name)}',$)`);
    const materialUsage = add(`IFCMATERIALLAYERSETUSAGE(#${materialSet},.AXIS3.,.POSITIVE.,0.,$)`);
    add(`IFCRELASSOCIATESMATERIAL('${guid()}',#${ownerHistory},$,$,(#${slab}),#${materialUsage})`);
    return slab;
  }
}

/** Restores the SmartBarn domain model embedded in IFC files produced by this exporter. */
export function parseSmartBarnFloorFieldIfc4(input: string): FloorFieldModel {
  if (!input.includes("FILE_SCHEMA(('IFC4'))")) throw new Error('Only IFC4 is supported in the first transport slice.');
  const markerIndex = input.indexOf(SMARTBARN_IFC_MARKER);
  if (markerIndex < 0) throw new Error('This IFC file was not created by SmartBarn. External IFC import is not enabled yet.');
  const start = markerIndex + SMARTBARN_IFC_MARKER.length;
  const end = input.indexOf(' */', start);
  if (end < 0) throw new Error('SmartBarn IFC metadata is malformed.');
  const model = JSON.parse(decodeURIComponent(input.slice(start, end))) as unknown;
  return validateFloorFieldModel(model);
}

function escapeIfc(value: string): string {
  return value.replaceAll("'", "''");
}

function number(value: number): string {
  return Number.isInteger(value) ? `${value}.` : String(value);
}
