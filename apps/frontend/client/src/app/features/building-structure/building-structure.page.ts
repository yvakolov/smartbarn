import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { lucidePlus, lucideX } from '@smartbarn/icons';
import { IconComponent, provideIcons } from '@smartbarn/ui-kit';
import { FLOOR_FIELD_CHANGED_EVENT, loadUnderWallsThicknessMm } from '../floor-field/floor-field.store';
import {
  loadBuildingStructure,
  rebuildStoreyElevations,
  roofBaseElevationMm,
  saveBuildingStructure,
  storeyTopElevationMm,
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
          <div class="mt-6 grid gap-4 rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-5 sm:grid-cols-2">
            <label class="text-sm">{{ 'structure.baseElevation' | transloco }}
              <input type="number" class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="structure().foundation.baseElevationMm" (change)="updateFoundation('baseElevationMm',$event)" />
            </label>
            <label class="text-sm">{{ 'structure.foundationHeight' | transloco }}
              <input type="number" class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="structure().foundation.heightMm" (change)="updateFoundation('heightMm',$event)" />
            </label>
            <div class="sm:col-span-2 grid gap-2 text-sm text-[var(--sb-text-muted)]">
              <div>{{ 'structure.foundationTop' | transloco }}: <strong class="text-[var(--sb-text)]">{{ foundationTop() }} {{ 'floorField.mm' | transloco }}</strong></div>
              <div>{{ 'structure.groundFloorHeight' | transloco }}: <strong class="text-[var(--sb-text)]">{{ underWallsThicknessMm() }} {{ 'floorField.mm' | transloco }}</strong></div>
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
                <div class="mt-4 grid gap-3 sm:grid-cols-4">
                  <label class="text-sm">{{ 'structure.baseElevation' | transloco }}<input type="number" class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="storey.baseElevationMm" readonly /></label>
                  <label class="text-sm">{{ 'structure.clearance' | transloco }}<input type="number" class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="storey.clearanceMm" (change)="updateStoreyClearance(storey.id,$event)" /></label>
                  <label class="text-sm">{{ 'structure.storeyHeight' | transloco }}<input type="number" class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="storey.heightMm" readonly /><small class="mt-1 block text-xs text-[var(--sb-text-muted)]">{{ 'structure.heightFormula' | transloco:{floor:underWallsThicknessMm()} }}</small></label>
                  <label class="text-sm">{{ (i < structure().storeys.length - 1 ? 'structure.nextStoreyBase' : 'structure.mauerlatElevation') | transloco }}<input type="number" class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="storeyTop(storey.id)" readonly /></label>
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
  readonly underWallsThicknessMm=signal(loadUnderWallsThicknessMm());
  private readonly refreshFromFloor=()=>{this.underWallsThicknessMm.set(loadUnderWallsThicknessMm());const next=rebuildStoreyElevations(this.structure());this.commit(next);};

  constructor(){if(typeof window!=='undefined')window.addEventListener(FLOOR_FIELD_CHANGED_EVENT,this.refreshFromFloor);}
  ngOnDestroy():void{if(typeof window!=='undefined')window.removeEventListener(FLOOR_FIELD_CHANGED_EVENT,this.refreshFromFloor);}
  foundationTop(): number { const f = this.structure().foundation; return f.baseElevationMm + f.heightMm; }
  roofBase(): number { return roofBaseElevationMm(this.structure()); }
  storeyTop(id: string): number { const storey = this.structure().storeys.find((item) => item.id === id); return storey ? storeyTopElevationMm(storey) : 0; }

  updateFoundation(key: 'baseElevationMm' | 'heightMm', event: Event): void {
    const value = this.readNumber(event, this.structure().foundation[key]);
    const foundation = { ...this.structure().foundation, [key]: value };
    this.commit(rebuildStoreyElevations({ ...this.structure(), foundation }));
  }

  addStorey(): void {
    const current = this.structure();
    const index = current.storeys.length + 1;
    const baseElevationMm = roofBaseElevationMm(current);
    const clearanceMm=2800;
    const heightMm=clearanceMm+this.underWallsThicknessMm();
    this.commit({ ...current, storeys: [...current.storeys, { id: `storey-${Date.now()}`, name: `Этаж ${index}`, baseElevationMm, clearanceMm, heightMm }] });
  }

  removeStorey(id: string): void {
    const current = this.structure();
    if (current.storeys.length <= 1) return;
    this.commit(rebuildStoreyElevations({ ...current, storeys: current.storeys.filter((storey) => storey.id !== id) }));
  }

  updateStoreyClearance(id: string, event: Event): void {
    const current = this.structure();
    const storeys = current.storeys.map((storey) => storey.id === id ? { ...storey, clearanceMm: Math.max(1800, this.readNumber(event, storey.clearanceMm)) } : storey);
    this.commit(rebuildStoreyElevations({ ...current, storeys }));
  }

  private readNumber(event: Event, fallback: number): number { const value = Number((event.target as HTMLInputElement).value); return Number.isFinite(value) ? Math.round(value) : fallback; }
  private commit(next: BuildingStructureModel): void { this.structure.set(next); saveBuildingStructure(next); }
}
