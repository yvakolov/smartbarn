import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import Konva from 'konva';
import { CheckboxComponent, InputNumberComponent } from '@smartbarn/ui-kit';
import { BUILDING_STRUCTURE_CHANGED_EVENT, loadBuildingStructure, rebuildStoreyElevations, saveBuildingStructure, type BuildingStructureModel } from '../building-structure/building-structure';
import { FLOOR_FIELD_CHANGED_EVENT, FloorFieldStore, loadFloorField, setFloorFieldWidth } from '../floor-field/floor-field.store';
import { loadWallSettings, saveWallSettings, WALL_SETTINGS_CHANGED_EVENT, wallThicknessMm } from '../walls/wall-settings';

type Selection = { type: 'foundation' | 'roof' } | { type: 'floor' | 'walls'; storeyId: string };
const VIEW_SETTINGS_KEY = 'smartbarn.building-profile.view.v1';
const PROFILE_SETTINGS_KEY = 'smartbarn.building-profile.settings.v1';

function loadViewSettings(): { showBothSides: boolean } {
  if (typeof localStorage === 'undefined') return { showBothSides: true };
  try { const value = JSON.parse(localStorage.getItem(VIEW_SETTINGS_KEY) ?? '{}') as { showBothSides?: unknown }; return { showBothSides: typeof value.showBothSides === 'boolean' ? value.showBothSides : true }; } catch { return { showBothSides: true }; }
}
function loadProfileSettings(): { roofLayerThicknessMm: number } {
  if (typeof localStorage === 'undefined') return { roofLayerThicknessMm: 200 };
  try { const value = JSON.parse(localStorage.getItem(PROFILE_SETTINGS_KEY) ?? '{}') as { roofLayerThicknessMm?: unknown }; const n = Number(value.roofLayerThicknessMm); return { roofLayerThicknessMm: Number.isFinite(n) ? Math.max(20, Math.min(1000, Math.round(n))) : 200 }; } catch { return { roofLayerThicknessMm: 200 }; }
}

@Component({ selector: 'sb-building-profile-page', standalone: true, imports: [InputNumberComponent, CheckboxComponent], templateUrl: './building-profile.page.html', styleUrl: './building-profile.page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class BuildingProfilePage implements AfterViewInit, OnDestroy {
  @ViewChild('konvaHost') private host?: ElementRef<HTMLDivElement>;
  readonly structure = signal<BuildingStructureModel>(loadBuildingStructure());
  readonly selection = signal<Selection | null>(null);
  readonly showBothSides = signal(loadViewSettings().showBothSides);
  readonly roofLayerThicknessMm = signal(loadProfileSettings().roofLayerThicknessMm);
  readonly profile = computed(() => {
    const structure = this.structure();
    const storeys = structure.storeys.map((s) => { const floor = loadFloorField(s.id), walls = loadWallSettings(s.id); return { ...s, floorThicknessMm: floor.layers.reduce((n, l) => n + l.thicknessMm, 0), wallThicknessMm: wallThicknessMm(walls), wallHeightMm: walls.sideWallHeightMm }; });
    const width = storeys.length ? loadFloorField(storeys[0].id).widthMm : 6000;
    const top = storeys.at(-1), pitch = top ? loadWallSettings(top.id).roofPitchDeg : 30;
    return { structure, storeys, roof: { pitch, width, rise: width / 2 * Math.tan(pitch * Math.PI / 180) } };
  });
  readonly maxElevation = computed(() => { const p = this.profile(), last = p.storeys.at(-1), pitchRad = p.roof.pitch * Math.PI / 180; return (last ? last.baseElevationMm + last.heightMm : 0) + p.roof.rise + this.roofLayerThicknessMm() / Math.max(.01, Math.cos(pitchRad)); });
  readonly minElevation = computed(() => this.profile().structure.foundation.baseElevationMm);
  private stage?: Konva.Stage;
  private resize?: ResizeObserver;
  private readonly floorStore = inject(FloorFieldStore);
  private readonly refresh = () => { this.structure.set(loadBuildingStructure()); this.draw(); };

  constructor(private readonly zone: NgZone) {
    if (typeof window !== 'undefined') { window.addEventListener(BUILDING_STRUCTURE_CHANGED_EVENT, this.refresh); window.addEventListener(FLOOR_FIELD_CHANGED_EVENT, this.refresh); window.addEventListener(WALL_SETTINGS_CHANGED_EVENT, this.refresh); }
  }
  ngAfterViewInit() { if (!this.host) return; this.zone.runOutsideAngular(() => { this.stage = new Konva.Stage({ container: this.host!.nativeElement, width: 1, height: 1 }); this.stage.on('click tap', (event) => { if (event.target !== this.stage) return; this.zone.run(() => { this.selection.set(null); this.draw(); }); }); this.resize = new ResizeObserver(() => this.draw()); this.resize.observe(this.host!.nativeElement); this.draw(); }); }
  ngOnDestroy() { if (typeof window !== 'undefined') { window.removeEventListener(BUILDING_STRUCTURE_CHANGED_EVENT, this.refresh); window.removeEventListener(FLOOR_FIELD_CHANGED_EVENT, this.refresh); window.removeEventListener(WALL_SETTINGS_CHANGED_EVENT, this.refresh); } this.resize?.disconnect(); this.stage?.destroy(); }
  private sameSelection(a: Selection | null, b: Selection) { return !!a && a.type === b.type && (!('storeyId' in b) || ('storeyId' in a && a.storeyId === b.storeyId)); }

  private draw() {
    const stage = this.stage, el = this.host?.nativeElement; if (!stage || !el) return;
    const width = Math.max(320, el.clientWidth), height = Math.max(320, el.clientHeight); stage.size({ width, height }); stage.destroyChildren();
    const geometryLayer = new Konva.Layer(), outlineLayer = new Konva.Layer({ listening: false }); stage.add(geometryLayer); stage.add(outlineLayer);
    const p = this.profile(), f = p.structure.foundation, min = this.minElevation(), max = this.maxElevation(), half = p.roof.width / 2, full = this.showBothSides(), horizontalSpan = full ? p.roof.width : half, pad = { l: 90, r: 50, t: 40, b: 70 };
    const scale = Math.min((width - pad.l - pad.r) / Math.max(1, horizontalSpan), (height - pad.t - pad.b) / Math.max(1, max - min));
    const x = (mm: number) => pad.l + mm * scale, y = (e: number) => height - pad.b - (e - min) * scale, h = (mm: number) => Math.max(1, mm * scale), mirror = (mm: number) => p.roof.width - mm, axisX = x(half);
    const stroke = '#6b7280', ink = '#111827', light = '#d1d5db', pale = '#e5e7eb', purple = '#7c3aed', red = '#dc2626';
    const selected = (s: Selection) => this.sameSelection(this.selection(), s);
    const bindSelection = (hitNodes: readonly Konva.Shape[], outlines: readonly Konva.Shape[], s: Selection) => { const refreshOutline = (hovered: boolean) => { for (const outline of outlines) { outline.stroke(selected(s) ? purple : hovered ? red : stroke); outline.strokeWidth(1); } outlineLayer.batchDraw(); }; refreshOutline(false); for (const node of hitNodes) { node.on('click tap', (event) => { event.cancelBubble = true; this.zone.run(() => { this.selection.set(s); this.draw(); }); }); node.on('mouseenter', () => { stage.container().style.cursor = 'pointer'; if (!selected(s)) refreshOutline(true); }); node.on('mouseleave', () => { stage.container().style.cursor = 'default'; if (!selected(s)) refreshOutline(false); }); } };
    const spanWidth = x(horizontalSpan) - x(0);
    const foundation = new Konva.Rect({ x: x(0), y: y(f.baseElevationMm + f.heightMm), width: spanWidth, height: h(f.heightMm), fill: light, stroke, strokeWidth: 1 }); geometryLayer.add(foundation); const foundationOutline = new Konva.Rect({ x: foundation.x(), y: foundation.y(), width: foundation.width(), height: foundation.height(), fillEnabled: false }); outlineLayer.add(foundationOutline); bindSelection([foundation], [foundationOutline], { type: 'foundation' });
    for (const [i, s] of p.storeys.entries()) {
      const floorSel: Selection = { type: 'floor', storeyId: s.id }, top = y(s.baseElevationMm + s.floorThicknessMm), bottom = y(s.baseElevationMm), floorHeight = bottom - top, floorNodes: Konva.Rect[] = [];
      const addFloorRect = (yy: number, hh: number, fill: string) => { const node = new Konva.Rect({ x: x(0), y: yy, width: spanWidth, height: hh, fill, stroke, strokeWidth: 1 }); geometryLayer.add(node); floorNodes.push(node); };
      if (i === 0) { const skin = Math.max(2, floorHeight * .055); addFloorRect(top, skin, light); addFloorRect(top + skin, Math.max(3, floorHeight - skin * 2), pale); addFloorRect(bottom - skin, skin, light); } else addFloorRect(top, floorHeight, pale);
      const floorOutline = new Konva.Rect({ x: x(0), y: top, width: spanWidth, height: floorHeight, fillEnabled: false }); outlineLayer.add(floorOutline); bindSelection(floorNodes, [floorOutline], floorSel);
      const wallSel: Selection = { type: 'walls', storeyId: s.id }, desiredTop = s.baseElevationMm + s.floorThicknessMm + s.wallHeightMm, next = p.storeys[i + 1], wallTopElevation = next ? Math.min(desiredTop, next.baseElevationMm) : desiredTop, wallTop = y(wallTopElevation), wallBottom = y(s.baseElevationMm + s.floorThicknessMm), wallWidth = h(s.wallThicknessMm);
      const wallNodes: Konva.Rect[] = [], wallOutlines: Konva.Rect[] = [];
      const addWall = (xx: number) => { const wall = new Konva.Rect({ x: xx, y: wallTop, width: wallWidth, height: wallBottom - wallTop, fill: pale, stroke, strokeWidth: 1 }); const outline = new Konva.Rect({ x: xx, y: wallTop, width: wallWidth, height: wallBottom - wallTop, fillEnabled: false }); geometryLayer.add(wall); outlineLayer.add(outline); wallNodes.push(wall); wallOutlines.push(outline); };
      addWall(x(0)); if (full) addWall(x(p.roof.width - s.wallThicknessMm)); bindSelection(wallNodes, wallOutlines, wallSel);
    }
    const last = p.storeys.at(-1);
    if (last) {
      const eave = last.baseElevationMm + last.floorThicknessMm + last.wallHeightMm, pitchRad = p.roof.pitch * Math.PI / 180, tanPitch = Math.tan(pitchRad), wt = last.wallThicknessMm, verticalOffset = this.roofLayerThicknessMm() / Math.max(.01, Math.cos(pitchRad)), innerAtRidge = eave + (half - wt) * tanPitch, outerAtWall = eave - wt * tanPitch + verticalOffset, outerAtRidge = innerAtRidge + verticalOffset;
      const left = [x(wt), y(eave), axisX, y(innerAtRidge), axisX, y(outerAtRidge), x(0), y(outerAtWall), x(0), y(eave)];
      const roofNodes: Konva.Line[] = [];
      const addRoof = (points: number[]) => { const roof = new Konva.Line({ points, closed: true, fill: pale, stroke, strokeWidth: 1, lineJoin: 'miter' }); geometryLayer.add(roof); roofNodes.push(roof); };
      addRoof(left);
      if (full) addRoof([x(mirror(wt)), y(eave), axisX, y(innerAtRidge), axisX, y(outerAtRidge), x(p.roof.width), y(outerAtWall), x(p.roof.width), y(eave)]);
      const roofOutlinePoints = full ? [x(wt), y(eave), axisX, y(innerAtRidge), x(mirror(wt)), y(eave), x(p.roof.width), y(eave), x(p.roof.width), y(outerAtWall), axisX, y(outerAtRidge), x(0), y(outerAtWall), x(0), y(eave)] : left;
      const roofOutline = new Konva.Line({ points: roofOutlinePoints, closed: true, fillEnabled: false, lineJoin: 'miter' }); outlineLayer.add(roofOutline); bindSelection(roofNodes, [roofOutline], { type: 'roof' });
      geometryLayer.add(new Konva.Line({ points: [axisX, pad.t, axisX, height - pad.b + 15], stroke, dash: [8, 6], strokeWidth: 1 }));
      const dimensionY = height - 28, dimensionEnd = full ? x(p.roof.width) : axisX, dimensionValue = full ? p.roof.width : half; geometryLayer.add(new Konva.Line({ points: [x(0), dimensionY, dimensionEnd, dimensionY], stroke: ink, strokeWidth: 1 })); geometryLayer.add(new Konva.Line({ points: [x(0), dimensionY - 10, x(0), dimensionY + 10], stroke: ink })); geometryLayer.add(new Konva.Line({ points: [dimensionEnd, dimensionY - 10, dimensionEnd, dimensionY + 10], stroke: ink })); geometryLayer.add(new Konva.Text({ x: x(0), y: dimensionY - 22, width: dimensionEnd - x(0), text: `${Math.round(dimensionValue)} мм`, align: 'center', fontSize: 13, fontFamily: 'monospace', fill: ink }));
      const zero = y(p.storeys[0].baseElevationMm + p.storeys[0].floorThicknessMm); geometryLayer.add(new Konva.Line({ points: [pad.l - 55, zero, x(0), zero], stroke: ink })); geometryLayer.add(new Konva.RegularPolygon({ x: x(0) - 7, y: zero, sides: 3, radius: 8, rotation: 90, fill: ink })); geometryLayer.add(new Konva.Text({ x: pad.l - 88, y: zero - 20, width: 70, text: '±0.00', align: 'right', fontSize: 13, fontFamily: 'monospace', fill: ink }));
    }
    geometryLayer.draw(); outlineLayer.moveToTop(); outlineLayer.draw();
  }

  buildingWidth() { return this.profile().roof.width; } roofPitch() { return this.profile().roof.pitch; } foundationHeight() { return this.structure().foundation.heightMm; } floorThickness(id: string) { return loadFloorField(id).layers.reduce((sum, l) => sum + l.thicknessMm, 0); } wallThickness(id: string) { return wallThicknessMm(loadWallSettings(id)); } wallHeight(id: string) { return loadWallSettings(id).sideWallHeightMm; }
  setShowBothSides(value: boolean) { this.showBothSides.set(value); if (typeof localStorage !== 'undefined') localStorage.setItem(VIEW_SETTINGS_KEY, JSON.stringify({ showBothSides: value })); this.draw(); }
  setBuildingWidth(value: number) { if (!Number.isFinite(value)) return; for (const s of this.structure().storeys) setFloorFieldWidth(s.id, value); this.structure.set(loadBuildingStructure()); this.draw(); }
  setRoofPitch(value: number) { if (!Number.isFinite(value)) return; const pitch = Math.max(5, Math.min(80, Math.round(value))); for (const s of this.structure().storeys) { const walls = loadWallSettings(s.id); saveWallSettings({ ...walls, roofPitchDeg: pitch }, s.id); } this.structure.set(loadBuildingStructure()); this.draw(); }
  setRoofLayerThickness(value: number) { if (!Number.isFinite(value)) return; const roofLayerThicknessMm = Math.max(20, Math.min(1000, Math.round(value))); this.roofLayerThicknessMm.set(roofLayerThicknessMm); if (typeof localStorage !== 'undefined') localStorage.setItem(PROFILE_SETTINGS_KEY, JSON.stringify({ roofLayerThicknessMm })); this.draw(); }
  setFoundationHeight(value: number) { if (!Number.isFinite(value)) return; const current = loadBuildingStructure(), heightMm = Math.max(100, Math.min(1000, Math.round(value))); saveBuildingStructure(rebuildStoreyElevations({ ...current, foundation: { ...current.foundation, heightMm } })); this.structure.set(loadBuildingStructure()); this.draw(); }
  setFloorThickness(id: string, value: number) { if (!Number.isFinite(value)) return; const model = loadFloorField(id), current = model.layers.reduce((sum, l) => sum + l.thicknessMm, 0), target = Math.max(20, Math.min(2000, Math.round(value))), adjustable = [...model.layers].sort((a, b) => b.thicknessMm - a.thicknessMm)[0]; if (!adjustable) return; this.floorStore.switchStorey(id); this.floorStore.updateLayer(adjustable.id, { thicknessMm: Math.max(1, adjustable.thicknessMm + target - current) }); this.structure.set(loadBuildingStructure()); this.draw(); }
  setWallThickness(id: string, value: number) { if (!Number.isFinite(value)) return; const walls = loadWallSettings(id), current = wallThicknessMm(walls), target = Math.max(20, Math.min(2000, Math.round(value))), adjustable = [...walls.layers].sort((a, b) => b.thicknessMm - a.thicknessMm)[0]; if (!adjustable) return; saveWallSettings({ ...walls, layers: walls.layers.map((l) => l.id === adjustable.id ? { ...l, thicknessMm: Math.max(1, l.thicknessMm + target - current) } : l) }, id); this.structure.set(loadBuildingStructure()); this.draw(); }
  setWallHeight(id: string, value: number) { if (!Number.isFinite(value)) return; const walls = loadWallSettings(id), sideWallHeightMm = Math.max(1000, Math.min(6000, Math.round(value))); saveWallSettings({ ...walls, sideWallHeightMm }, id); this.structure.set(loadBuildingStructure()); this.draw(); }
}