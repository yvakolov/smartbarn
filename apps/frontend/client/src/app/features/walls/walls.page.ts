import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subscription } from 'rxjs';
import { loadMaterialCatalog, materialById } from '../materials/material-catalog';
import { WallSettingsModel, loadWallSettings, saveWallSettings, wallThicknessMm } from './wall-settings';

@Component({selector:'smartbarn-walls-page',standalone:true,imports:[TranslocoPipe],changeDetection:ChangeDetectionStrategy.OnPush,template:`
<section class="mx-auto max-w-3xl p-6 text-[var(--sb-text)]">
  <h1 class="mb-2 text-xl font-semibold">{{'walls.title'|transloco}}</h1>
  <p class="mb-6 text-sm text-[var(--sb-text-muted)]">Наружные стены текущего этажа. Боковые стены задают высоту карниза, фронтонные стены расположены между ними и следуют углу кровли.</p>
  <div class="mb-4 grid gap-4 rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-4 sm:grid-cols-2">
    <label class="grid gap-2 text-sm text-[var(--sb-text-muted)]">Высота боковых стен
      <div class="flex items-center rounded-md border border-[var(--sb-border)] bg-[var(--sb-bg)] px-3 py-2"><input class="min-w-0 flex-1 border-0 bg-transparent text-[var(--sb-text)] outline-none" type="number" min="1000" max="6000" [value]="settings().sideWallHeightMm" (input)="updateHeight($event)"/><span class="text-xs">мм</span></div>
    </label>
    <label class="grid gap-2 text-sm text-[var(--sb-text-muted)]">Угол ската кровли
      <div class="flex items-center rounded-md border border-[var(--sb-border)] bg-[var(--sb-bg)] px-3 py-2"><input class="min-w-0 flex-1 border-0 bg-transparent text-[var(--sb-text)] outline-none" type="number" min="5" max="80" [value]="settings().roofPitchDeg" (input)="updateRoofPitch($event)"/><span class="text-xs">°</span></div>
    </label>
  </div>
  <div class="rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-4">
    <div class="mb-4 flex items-center justify-between"><div><div class="font-medium">Пирог наружной стены</div><div class="text-xs text-[var(--sb-text-muted)]">SIP-{{totalThicknessMm()}} · снаружи → внутрь</div></div><div class="text-sm font-medium">{{totalThicknessMm()}} мм</div></div>
    <div class="grid gap-3">
      @for(layer of settings().layers; track layer.id){
        <div class="grid gap-2 rounded-md border border-[var(--sb-border)] p-3 sm:grid-cols-[1fr_120px]">
          <label class="grid gap-1 text-xs text-[var(--sb-text-muted)]">Материал
            <select class="rounded-md border border-[var(--sb-border)] bg-[var(--sb-bg)] px-2 py-2 text-sm text-[var(--sb-text)]" [value]="layer.materialId" (change)="updateMaterial(layer.id,$event)">@for(material of materials; track material.id){<option [value]="material.id">{{material.name}}</option>}</select>
          </label>
          <label class="grid gap-1 text-xs text-[var(--sb-text-muted)]">Толщина, мм<input class="rounded-md border border-[var(--sb-border)] bg-[var(--sb-bg)] px-2 py-2 text-sm text-[var(--sb-text)]" type="number" min="1" max="2000" [value]="layer.thicknessMm" (input)="updateLayerThickness(layer.id,$event)"/></label>
        </div>
      }
    </div>
    <p class="mt-4 text-xs text-[var(--sb-text-muted)]">По умолчанию: OSB-3 12 мм + EPS 150 мм + OSB-3 12 мм. Состав хранится отдельно для каждого этажа.</p>
  </div>
</section>`})
export class WallsPage implements OnDestroy{
  private readonly route=inject(ActivatedRoute);private storeyId='storey-1';private readonly routeSub:Subscription;
  readonly settings=signal<WallSettingsModel>(loadWallSettings());readonly materials=loadMaterialCatalog();readonly totalThicknessMm=computed(()=>wallThicknessMm(this.settings()));
  constructor(){this.routeSub=this.route.queryParamMap.subscribe(params=>{this.storeyId=params.get('storey')??'storey-1';this.settings.set(loadWallSettings(this.storeyId));});}
  ngOnDestroy():void{this.routeSub.unsubscribe();}
  private persist(next:WallSettingsModel){this.settings.set(next);saveWallSettings(next,this.storeyId);}
  updateHeight(event:Event){const n=Number((event.target as HTMLInputElement).value);if(!Number.isFinite(n))return;this.persist({...this.settings(),sideWallHeightMm:Math.min(6000,Math.max(1000,Math.round(n)))});}
  updateRoofPitch(event:Event){const n=Number((event.target as HTMLInputElement).value);if(!Number.isFinite(n))return;this.persist({...this.settings(),roofPitchDeg:Math.min(80,Math.max(5,Math.round(n)))});}
  updateLayerThickness(id:number,event:Event){const n=Number((event.target as HTMLInputElement).value);if(!Number.isFinite(n))return;this.persist({...this.settings(),layers:this.settings().layers.map(l=>l.id===id?{...l,thicknessMm:Math.min(2000,Math.max(1,Math.round(n)))}:l)});}
  updateMaterial(id:number,event:Event){const materialId=(event.target as HTMLSelectElement).value,m=materialById(materialId);if(!m)return;this.persist({...this.settings(),layers:this.settings().layers.map(l=>l.id===id?{...l,materialId:m.id,thicknessMm:m.defaultThicknessMm??l.thicknessMm}:l)});}
}
