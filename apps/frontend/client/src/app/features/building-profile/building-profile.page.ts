import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, ViewChild, computed, signal } from '@angular/core';
import Konva from 'konva';
import { InputNumberComponent } from '@smartbarn/ui-kit';
import { BUILDING_STRUCTURE_CHANGED_EVENT, loadBuildingStructure, type BuildingStructureModel } from '../building-structure/building-structure';
import { FLOOR_FIELD_CHANGED_EVENT, loadFloorField, setFloorFieldWidth } from '../floor-field/floor-field.store';
import { loadMaterialCatalog, materialById } from '../materials/material-catalog';
import { loadWallSettings, saveWallSettings, WALL_SETTINGS_CHANGED_EVENT, wallThicknessMm, type WallLayerZone, type WallSettingsModel } from '../walls/wall-settings';

type ViewMode = 'half' | 'full' | '3d';
type Selection = { type: 'foundation' | 'roof' } | { type: 'floor' | 'walls'; storeyId: string };

@Component({
  selector: 'sb-building-profile-page',
  standalone: true,
  imports: [InputNumberComponent],
  templateUrl: './building-profile.page.html',
  styleUrl: './building-profile.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildingProfilePage implements AfterViewInit, OnDestroy {
  @ViewChild('konvaHost') private host?: ElementRef<HTMLDivElement>;
  readonly structure = signal<BuildingStructureModel>(loadBuildingStructure());
  readonly selection = signal<Selection | null>(null);
  readonly viewMode = signal<ViewMode>('half');
  readonly materials = loadMaterialCatalog();
  readonly wallEditor = signal<WallSettingsModel | null>(null);
  readonly roofLayerThicknessMm = signal(200);
  readonly zones: readonly { id: WallLayerZone; title: string }[] = [
    { id: 'exterior', title: 'Снаружи' },
    { id: 'core', title: 'Конструктив SIP' },
    { id: 'interior', title: 'Внутри' },
  ];

  readonly profile = computed(() => {
    const structure = this.structure();
    const storeys = structure.storeys.map((s) => {
      const floor = loadFloorField(s.id);
      const walls = loadWallSettings(s.id);
      return {
        ...s,
        floorThicknessMm: floor.layers.reduce((n, l) => n + l.thicknessMm, 0),
        wallThicknessMm: wallThicknessMm(walls),
        wallHeightMm: walls.sideWallHeightMm,
        layers: floor.layers,
        wallLayers: walls.layers,
      };
    });
    const width = storeys.length ? loadFloorField(storeys[0].id).widthMm : 6000;
    const top = storeys.at(-1);
    const pitch = top ? loadWallSettings(top.id).roofPitchDeg : 30;
    const rise = (width / 2) * Math.tan((pitch * Math.PI) / 180);
    return { structure, storeys, roof: { pitch, width, rise } };
  });

  readonly maxElevation = computed(() => {
    const p = this.profile();
    const last = p.storeys.at(-1);
    const pitchRad = (p.roof.pitch * Math.PI) / 180;
    const roofVerticalThickness = this.roofLayerThicknessMm() / Math.max(0.01, Math.cos(pitchRad));
    return (last ? last.baseElevationMm + last.heightMm : 0) + p.roof.rise + roofVerticalThickness;
  });
  readonly minElevation = computed(() => this.profile().structure.foundation.baseElevationMm);

  private stage?: Konva.Stage;
  private resize?: ResizeObserver;
  private readonly refresh = () => {
    this.structure.set(loadBuildingStructure());
    const s = this.selection();
    if (s?.type === 'walls') this.wallEditor.set(loadWallSettings(s.storeyId));
    this.draw();
  };

  constructor(private readonly zone: NgZone) {
    if (typeof window !== 'undefined') {
      window.addEventListener(BUILDING_STRUCTURE_CHANGED_EVENT, this.refresh);
      window.addEventListener(FLOOR_FIELD_CHANGED_EVENT, this.refresh);
      window.addEventListener(WALL_SETTINGS_CHANGED_EVENT, this.refresh);
    }
  }

  ngAfterViewInit() {
    if (!this.host) return;
    this.zone.runOutsideAngular(() => {
      this.stage = new Konva.Stage({ container: this.host!.nativeElement, width: 1, height: 1 });
      this.stage.on('click tap', (event) => {
        if (event.target !== this.stage) return;
        this.zone.run(() => {
          this.selection.set(null);
          this.wallEditor.set(null);
          this.draw();
        });
      });
      this.resize = new ResizeObserver(() => this.draw());
      this.resize.observe(this.host!.nativeElement);
      this.draw();
    });
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener(BUILDING_STRUCTURE_CHANGED_EVENT, this.refresh);
      window.removeEventListener(FLOOR_FIELD_CHANGED_EVENT, this.refresh);
      window.removeEventListener(WALL_SETTINGS_CHANGED_EVENT, this.refresh);
    }
    this.resize?.disconnect();
    this.stage?.destroy();
  }

  private sameSelection(a: Selection | null, b: Selection) {
    return !!a && a.type === b.type && (!('storeyId' in b) || ('storeyId' in a && a.storeyId === b.storeyId));
  }

  private draw() {
    const stage = this.stage;
    const el = this.host?.nativeElement;
    if (!stage || !el) return;

    const width = Math.max(320, el.clientWidth);
    const height = Math.max(320, el.clientHeight);
    stage.size({ width, height });
    stage.destroyChildren();

    const geometryLayer = new Konva.Layer();
    const outlineLayer = new Konva.Layer({ listening: false });
    stage.add(geometryLayer);
    stage.add(outlineLayer);

    const p = this.profile();
    const f = p.structure.foundation;
    const min = this.minElevation();
    const max = this.maxElevation();
    const half = p.roof.width / 2;
    const pad = { l: 90, r: 50, t: 40, b: 70 };
    const scale = Math.min(
      (width - pad.l - pad.r) / Math.max(1, half),
      (height - pad.t - pad.b) / Math.max(1, max - min),
    );
    const x = (mm: number) => pad.l + mm * scale;
    const y = (elevation: number) => height - pad.b - (elevation - min) * scale;
    const h = (mm: number) => Math.max(1, mm * scale);
    const axisX = x(half);
    const stroke = '#6b7280';
    const ink = '#111827';
    const light = '#d1d5db';
    const pale = '#e5e7eb';
    const purple = '#7c3aed';
    const red = '#dc2626';
    const selected = (s: Selection) => this.sameSelection(this.selection(), s);

    const bindSelection = (hitNodes: readonly Konva.Shape[], outline: Konva.Shape, s: Selection) => {
      const refreshOutline = (hovered: boolean) => {
        outline.stroke(selected(s) ? purple : hovered ? red : stroke);
        outline.strokeWidth(1);
        outlineLayer.batchDraw();
      };
      refreshOutline(false);
      for (const node of hitNodes) {
        node.on('click tap', (event) => {
          event.cancelBubble = true;
          this.zone.run(() => {
            this.select(s);
            this.draw();
          });
        });
        node.on('mouseenter', () => {
          stage.container().style.cursor = 'pointer';
          if (!selected(s)) refreshOutline(true);
        });
        node.on('mouseleave', () => {
          stage.container().style.cursor = 'default';
          if (!selected(s)) refreshOutline(false);
        });
      }
    };

    const foundation = new Konva.Rect({
      x: x(0),
      y: y(f.baseElevationMm + f.heightMm),
      width: axisX - x(0),
      height: h(f.heightMm),
      fill: light,
      stroke,
      strokeWidth: 1,
    });
    geometryLayer.add(foundation);
    const foundationOutline = new Konva.Rect({
      x: foundation.x(), y: foundation.y(), width: foundation.width(), height: foundation.height(), fillEnabled: false,
    });
    outlineLayer.add(foundationOutline);
    bindSelection([foundation], foundationOutline, { type: 'foundation' });

    for (const [i, s] of p.storeys.entries()) {
      const floorSel: Selection = { type: 'floor', storeyId: s.id };
      const top = y(s.baseElevationMm + s.floorThicknessMm);
      const bottom = y(s.baseElevationMm);
      const floorHeight = bottom - top;
      const floorNodes: Konva.Rect[] = [];
      const addFloorRect = (config: Konva.RectConfig) => {
        const node = new Konva.Rect({ ...config, stroke, strokeWidth: 1 });
        geometryLayer.add(node);
        floorNodes.push(node);
      };
      if (i === 0) {
        const skin = Math.max(2, floorHeight * 0.055);
        addFloorRect({ x: x(0), y: top, width: axisX - x(0), height: skin, fill: light });
        addFloorRect({ x: x(0), y: top + skin, width: axisX - x(0), height: Math.max(3, floorHeight - skin * 2), fill: pale });
        addFloorRect({ x: x(0), y: bottom - skin, width: axisX - x(0), height: skin, fill: light });
      } else {
        addFloorRect({ x: x(0), y: top, width: axisX - x(0), height: floorHeight, fill: pale });
      }
      const floorOutline = new Konva.Rect({
        x: x(0), y: top, width: axisX - x(0), height: floorHeight, fillEnabled: false,
      });
      outlineLayer.add(floorOutline);
      bindSelection(floorNodes, floorOutline, floorSel);

      const wallSel: Selection = { type: 'walls', storeyId: s.id };
      const wallTop = y(s.baseElevationMm + s.floorThicknessMm + s.wallHeightMm);
      const wallBottom = y(s.baseElevationMm + s.floorThicknessMm);
      const wallWidth = h(s.wallThicknessMm);
      const wall = new Konva.Rect({
        x: x(0), y: wallTop, width: wallWidth, height: wallBottom - wallTop, fill: pale, stroke, strokeWidth: 1,
      });
      geometryLayer.add(wall);
      const wallOutline = new Konva.Rect({
        x: wall.x(), y: wall.y(), width: wall.width(), height: wall.height(), fillEnabled: false,
      });
      outlineLayer.add(wallOutline);
      bindSelection([wall], wallOutline, wallSel);
    }

    const last = p.storeys.at(-1);
    if (last) {
      const eave = last.baseElevationMm + last.floorThicknessMm + last.wallHeightMm;
      const pitchRad = (p.roof.pitch * Math.PI) / 180;
      const verticalOffset = this.roofLayerThicknessMm() / Math.max(0.01, Math.cos(pitchRad));
      const roofPoints = [
        x(0), y(eave),
        axisX, y(eave + p.roof.rise),
        axisX, y(eave + p.roof.rise + verticalOffset),
        x(0), y(eave + verticalOffset),
      ];
      const roof = new Konva.Line({
        points: roofPoints,
        closed: true,
        fill: pale,
        stroke,
        strokeWidth: 1,
        lineJoin: 'miter',
      });
      geometryLayer.add(roof);
      const roofOutline = new Konva.Line({ points: roofPoints, closed: true, fillEnabled: false, lineJoin: 'miter' });
      outlineLayer.add(roofOutline);
      bindSelection([roof], roofOutline, { type: 'roof' });

      geometryLayer.add(new Konva.Line({ points: [axisX, pad.t, axisX, height - pad.b + 15], stroke, dash: [8, 6], strokeWidth: 1 }));
      const dimensionY = height - 28;
      geometryLayer.add(new Konva.Line({ points: [x(0), dimensionY, axisX, dimensionY], stroke: ink, strokeWidth: 1 }));
      geometryLayer.add(new Konva.Line({ points: [x(0), dimensionY - 10, x(0), dimensionY + 10], stroke: ink }));
      geometryLayer.add(new Konva.Line({ points: [axisX, dimensionY - 10, axisX, dimensionY + 10], stroke: ink }));
      geometryLayer.add(new Konva.Text({ x: x(0), y: dimensionY - 22, width: axisX - x(0), text: `${Math.round(half)} мм`, align: 'center', fontSize: 13, fontFamily: 'monospace', fill: ink }));
      const zero = y(p.storeys[0].baseElevationMm + p.storeys[0].floorThicknessMm);
      geometryLayer.add(new Konva.Line({ points: [pad.l - 55, zero, x(0), zero], stroke: ink }));
      geometryLayer.add(new Konva.RegularPolygon({ x: x(0) - 7, y: zero, sides: 3, radius: 8, rotation: 90, fill: ink }));
      geometryLayer.add(new Konva.Text({ x: pad.l - 88, y: zero - 20, width: 70, text: '±0.00', align: 'right', fontSize: 13, fontFamily: 'monospace', fill: ink }));
    }

    geometryLayer.draw();
    outlineLayer.moveToTop();
    outlineLayer.draw();
  }

  buildingWidth() { return this.profile().roof.width; }
  setBuildingWidth(value: number) {
    if (!Number.isFinite(value)) return;
    for (const storey of this.structure().storeys) setFloorFieldWidth(storey.id, value);
    this.structure.set(loadBuildingStructure());
    this.draw();
  }
  setRoofLayerThickness(value: number) {
    if (!Number.isFinite(value)) return;
    this.roofLayerThicknessMm.set(Math.max(20, Math.min(1000, Math.round(value))));
    this.draw();
  }
  setView(v: ViewMode) { this.viewMode.set(v); this.draw(); }
  select(s: Selection) {
    this.selection.set(s);
    this.wallEditor.set(s.type === 'walls' ? loadWallSettings(s.storeyId) : null);
  }
  isSelected(t: Selection['type'], id?: string) {
    const s = this.selection();
    return !!s && s.type === t && (!id || ('storeyId' in s && s.storeyId === id));
  }
  materialName(id: string) { return materialById(id)?.name ?? id; }
  wallLayers(z: WallLayerZone) { return this.wallEditor()?.layers.filter((l) => l.zone === z) ?? []; }
  private saveWall(next: WallSettingsModel) {
    const s = this.selection();
    if (s?.type !== 'walls') return;
    this.wallEditor.set(next);
    saveWallSettings(next, s.storeyId);
    this.structure.set(loadBuildingStructure());
    this.draw();
  }
  wallHeight(e: Event) {
    const w = this.wallEditor();
    const n = Number((e.target as HTMLInputElement).value);
    if (w && Number.isFinite(n)) this.saveWall({ ...w, sideWallHeightMm: Math.max(1000, Math.min(6000, Math.round(n))) });
  }
  wallLayerThickness(id: number, e: Event) {
    const w = this.wallEditor();
    const n = Number((e.target as HTMLInputElement).value);
    if (w && Number.isFinite(n)) this.saveWall({ ...w, layers: w.layers.map((l) => l.id === id ? { ...l, thicknessMm: Math.max(.5, Math.min(2000, n)) } : l) });
  }
  wallLayerMaterial(id: number, e: Event) {
    const w = this.wallEditor();
    const materialId = (e.target as HTMLSelectElement).value;
    const m = materialById(materialId);
    if (w && m) this.saveWall({ ...w, layers: w.layers.map((l) => l.id === id ? { ...l, materialId, thicknessMm: m.defaultThicknessMm ?? l.thicknessMm } : l) });
  }
  addWallLayer(z: WallLayerZone) {
    const w = this.wallEditor();
    if (!w) return;
    const id = Math.max(0, ...w.layers.map((l) => l.id)) + 1;
    const materialId = z === 'exterior' ? 'ventilated-cavity' : z === 'interior' ? 'service-cavity' : 'eps';
    const m = materialById(materialId);
    const layer = { id, zone: z, materialId, thicknessMm: m?.defaultThicknessMm ?? 50 };
    let layers = [...w.layers];
    if (z === 'exterior') layers = [layer, ...layers];
    else if (z === 'interior') layers.push(layer);
    else {
      const i = layers.findIndex((l) => l.zone === 'interior');
      layers.splice(i < 0 ? layers.length : i, 0, layer);
    }
    this.saveWall({ ...w, layers });
  }
  removeWallLayer(id: number) {
    const w = this.wallEditor();
    if (w) this.saveWall({ ...w, layers: w.layers.filter((l) => l.id !== id) });
  }
}
