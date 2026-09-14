import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { lucidePlus, lucideX } from '@smartbarn/icons';
import { IconComponent, provideIcons } from '@smartbarn/ui-kit';
import { cloneFloorFieldForStorey, FLOOR_FIELD_CHANGED_EVENT, loadUnderWallsThicknessMm, removeFloorFieldForStorey } from '../floor-field/floor-field.store';
import { cloneWallSettingsForStorey, removeWallSettingsForStorey } from '../walls/wall-settings';
import {
  loadBuildingStructure,
  rebuildStoreyElevations,
  roofBaseElevationMm,
  saveBuildingStructure,
  type BuildingStructureModel,
} from './building-structure';

type StructureMode = 'foundation' | 'storeys';

@Component({
  selector: 'smartbarn-building-structure-page',
  standalone: true,
  imports: [TranslocoPipe, IconComponent],
  providers: [...provideIcons(lucidePlus, lucideX)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="h-full overflow-auto bg-[var(--sb-bg)] p-4 text-[var(--sb-text)] md:p-6">
      <div class="mx-auto max-w-3xl">
        @if (mode === 'foundation') {
          <h1 class="text-xl font-semibold">{{ 'structure.foundation' | transloco }}</h1>
          <p class="mt-1 text-sm text-[var(--sb-text-muted)]">{{ 'structure.foundationHint' | transloco }}</p>
          <div class="mt-6 grid gap-4 rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-5">
            <label class="text-sm">{{ 'structure.foundationHeight' | transloco }}
              <input type="number" class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="structure().foundation.heightMm" (change)="updateFoundationHeight($event)" />
            </label>
            <div class="grid gap-2 text-sm text-[var(--sb-text-muted)]">
              <div>{{ 'structure.baseElevation' | transloco }}: <strong class="text-[var(--sb-text)]">{{ structure().foundation.baseElevationMm }} {{ 'floorField.mm' | transloco }}</strong></div>
              <div>{{ 'structure.foundationTop' | transloco }}: <strong class="text-[var(--sb-text)]">{{ foundationTop() }} {{ 'floorField.mm' | transloco }}</strong></div>
              <div>{{ 'structure.groundFloorHeight' | transloco }}: <strong class="text-[var(--sb-text)]">{{ firstStoreyFloorThickness() }} {{ 'floorField.mm' | transloco }}</strong></div>
            </div>
          </div>
        } @else {
          <div class="flex items-start justify-between gap-3">
            <div><h1 class="text-xl font-semibold">{{ 'structure.storeys' | transloco }}</h1><p class="mt-1 text-sm text-[var(--sb-text-muted)]">{{ 'structure.storeysHint' | transloco }}</p></div>
            <button class="flex items-center gap-1.5 rounded bg-[var(--sb-accent)] px-3 py-2 text-sm text-white" (click)="addStorey()"><sb-icon name="plus" />{{ 'structure.addStorey' | transloco }}</button>
          </div>
          <div class="mt-6 space-y-3">
            @for (storey of structure().storeys; track storey.id; let i = $index) {
              <article class="rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-5">
                <div class="flex items-start justify-between gap-3">
                  <strong>{{ 'structure.storey' | transloco }} {{ i + 1 }}</strong>
                  @if (structure().storeys.length > 1) {<button class="rounded p-1 text-[var(--sb-text-muted)] hover:bg-[var(--sb-gray-3)]" (click)="removeStorey(storey.id)" [attr.aria-label]="'structure.removeStorey'|transloco"><sb-icon name="x" /></button>}
                </div>
                <div class="mt-4 grid gap-3 sm:grid-cols-3">
                  <label class="text-sm">{{ 'structure.baseElevation' | transloco }}<input type="number" class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="storey.baseElevationMm" readonly /></label>
                  <label class="text-sm">{{ 'structure.clearance' | transloco }}<input type="number" class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="storey.clearanceMm" (change)="updateStoreyClearance(storey.id,$event)" /></label>
                  <label class="text-sm">{{ 'structure.storeyHeight' | transloco }}<input type="number" class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="storey.heightMm" readonly /><small class="mt-1 block text-xs text-[var(--sb-text-muted)]">{{ 'structure.heightFormula' | transloco:{floor:floorThickness(storey.id)} }}</small></label>
                </div>
              </article>
            }
          </div>
          <div class="mt-4 rounded-lg border border-dashed border-[var(--sb-border)] p-4 text-sm text-[var(--sb-text-muted)]">{{ 'structure.mauerlatElevation' | transloco }}: <strong class="text-[var(--sb-text)]">{{ roofBase() }} {{ 'floorField.mm' | transloco }}</strong></div>
        }
      </div>
    </section>
  `,
})
export class BuildingStructurePage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  readonly mode = (this.route.snapshot.data['mode'] as StructureMode | undefined) ?? 'storeys';
  readonly structure = signal<BuildingStructureModel>(loadBuildingStructure());
  private readonly refreshFromFloor=()=>this.commit(rebuildStoreyElevations(this.structure()));

  constructor(){if(typeof window!=='undefined')window.addEventListener(FLOOR_FIELD_CHANGED_EVENT,this.refreshFromFloor);}
  ngOnDestroy():void{if(typeof window!=='undefined')window.removeEventListener(FLOOR_FIELD_CHANGED_EVENT,this.refreshFromFloor);}
  foundationTop(): number { const f = this.structure().foundation; return f.baseElevationMm + f.heightMm; }
  roofBase(): number { return roofBaseElevationMm(this.structure()); }
  floorThickness(storeyId:string):number{return loadUnderWallsThicknessMm(storeyId);}
  firstStoreyFloorThickness():number{const first=this.structure().storeys[0];return first?this.floorThickness(first.id):0;}

  updateFoundationHeight(event: Event): void {
    const current=this.structure();
    const heightMm=Math.max(100,this.readNumber(event,current.foundation.heightMm));
    this.commit(rebuildStoreyElevations({ ...current, foundation:{...current.foundation,heightMm} }));
  }

  addStorey(): void {
    const current = this.structure();
    const previous=current.storeys.at(-1);
    const index = current.storeys.length + 1;
    const id=`storey-${Date.now()}`;
    if(previous){cloneFloorFieldForStorey(previous.id,id);cloneWallSettingsForStorey(previous.id,id);}
    const clearanceMm=previous?.clearanceMm??2800;
    const heightMm=clearanceMm+loadUnderWallsThicknessMm(id);
    const baseElevationMm=roofBaseElevationMm(current);
    this.commit(rebuildStoreyElevations({ ...current, storeys: [...current.storeys, { id, name: `Этаж ${index}`, baseElevationMm, clearanceMm, heightMm }] }));
  }

  removeStorey(id: string): void {
    const current = this.structure();
    if (current.storeys.length <= 1) return;
    const next=rebuildStoreyElevations({ ...current, storeys: current.storeys.filter((storey) => storey.id !== id) });
    this.commit(next);
    removeFloorFieldForStorey(id);
    removeWallSettingsForStorey(id);
  }

  updateStoreyClearance(id: string, event: Event): void {
    const current = this.structure();
    const storeys = current.storeys.map((storey) => storey.id === id ? { ...storey, clearanceMm: Math.max(1800, this.readNumber(event, storey.clearanceMm)) } : storey);
    this.commit(rebuildStoreyElevations({ ...current, storeys }));
  }

  private readNumber(event: Event, fallback: number): number { const value = Number((event.target as HTMLInputElement).value); return Number.isFinite(value) ? Math.round(value) : fallback; }
  private commit(next: BuildingStructureModel): void { this.structure.set(next); saveBuildingStructure(next); }
}
