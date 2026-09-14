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

  const layers = orderedLayersTopToBottom(model);
  if (layers.length) {
    const totalThicknessMm = layers.reduce((sum, layer) => sum + layer.thicknessMm, 0);
    const topElevationMm =
      model.referencePlane.elevationMm + model.layersAbove.reduce((sum, layer) => sum + layer.thicknessMm, 0);

    const slabPoint = add(`IFCCARTESIANPOINT((0.,0.,${number(topElevationMm)}))`);
    const slabAxis = add(`IFCAXIS2PLACEMENT3D(#${slabPoint},$,$)`);
    const slabPlacement = add(`IFCLOCALPLACEMENT(#${storeyPlacement},#${slabAxis})`);
    const profile = add(
      `IFCRECTANGLEPROFILEDEF(.AREA.,$,$,${number(model.geometry.lengthMm)},${number(model.geometry.widthMm)})`,
    );
    const downwardDirection = add('IFCDIRECTION((0.,0.,-1.))');
    const solid = add(
      `IFCEXTRUDEDAREASOLID(#${profile},#${worldAxis},#${downwardDirection},${number(totalThicknessMm)})`,
    );
    const representation = add(`IFCSHAPEREPRESENTATION(#${context},'Body','SweptSolid',(#${solid}))`);
    const shape = add(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${representation}))`);
    const slab = add(
      `IFCSLAB('${guid()}',#${ownerHistory},'Цокольное перекрытие',$,'SmartBarn Floor Field',#${slabPlacement},#${shape},$,.BASESLAB.)`,
    );

    const materialLayerIds = layers.map((layer) => addMaterialLayer(layer));
    const materialSet = add(
      `IFCMATERIALLAYERSET((${materialLayerIds.map((id) => `#${id}`).join(',')}),'SmartBarn Floor Field',$)`,
    );
    const materialUsage = add(`IFCMATERIALLAYERSETUSAGE(#${materialSet},.AXIS3.,.NEGATIVE.,0.,$)`);
    add(`IFCRELASSOCIATESMATERIAL('${guid()}',#${ownerHistory},$,$,(#${slab}),#${materialUsage})`);
    add(`IFCRELCONTAINEDINSPATIALSTRUCTURE('${guid()}',#${ownerHistory},$,$,(#${slab}),#${storey})`);
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

  function addMaterialLayer(layer: FloorFieldLayer): number {
    const material = add(`IFCMATERIAL('${escapeIfc(layer.type)}',$,$)`);
    return add(
      `IFCMATERIALLAYER(#${material},${number(layer.thicknessMm)},$,$,'${escapeIfc(layer.name)}',$,$)`,
    );
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

function orderedLayersTopToBottom(model: FloorFieldModel): readonly FloorFieldLayer[] {
  return [...model.layersAbove].reverse().concat(model.layersBelow);
}

function escapeIfc(value: string): string {
  return value.replaceAll("'", "''");
}

function number(value: number): string {
  return Number.isInteger(value) ? `${value}.` : String(value);
}
