import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { lucidePlus } from '@smartbarn/icons';
import { IconComponent, provideIcons } from '@smartbarn/ui-kit';
import { MATERIAL_GROUPS, loadMaterialCatalog, saveMaterialCatalog, type MaterialGroup, type MaterialRecord } from './material-catalog';

@Component({selector:'smartbarn-materials-page',standalone:true,imports:[IconComponent],providers:[...provideIcons(lucidePlus)],changeDetection:ChangeDetectionStrategy.OnPush,template:`
<section class="h-full overflow-auto bg-[var(--sb-bg)] p-4 text-[var(--sb-text)] md:p-6"><div class="mx-auto max-w-5xl">
<div class="flex items-center justify-between gap-3"><div><h1 class="text-xl font-semibold">Справочник материалов</h1><p class="mt-1 text-sm text-[var(--sb-text-muted)]">Материалы — самостоятельные сущности с физическими и техническими характеристиками.</p></div><button class="flex items-center gap-1.5 rounded bg-[var(--sb-accent)] px-3 py-2 text-sm text-white" (click)="startCreate()"><sb-icon name="plus" /> Материал</button></div>
<main class="mt-6 space-y-3">@for(material of filtered();track material.id){<article class="cursor-pointer rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-4" [class.ring-2]="selectedMaterialId()===material.id" [class.ring-[var(--sb-accent)]]="selectedMaterialId()===material.id" (click)="edit(material)"><div class="flex items-center gap-3"><span class="h-8 w-8 rounded border border-[var(--sb-border)]" [style.background]="material.color"></span><div class="min-w-0"><strong class="block truncate">{{material.name}}</strong><span class="text-xs text-[var(--sb-text-muted)]">{{material.manufacturer || 'Без производителя'}} · {{material.defaultThicknessMm || '—'}} мм</span></div></div></article>}@if(!filtered().length){<p class="p-4 text-sm text-[var(--sb-text-muted)]">В выбранной группе пока нет материалов.</p>}</main>
@if(editor()){<div class="mt-6 rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-5"><h2 class="font-semibold">{{editingId()?'Карточка материала':'Новый материал'}}</h2><div class="mt-4 grid gap-3 sm:grid-cols-2">
<label class="text-sm">Название<input class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="editor()!.name" (input)="field('name',$event)"/></label><label class="text-sm">Группа<select class="mt-1 w-full rounded border border-[var(--sb-border)] bg-[var(--sb-surface)] p-2" [value]="editor()!.group" (change)="field('group',$event)">@for(group of groups;track group.id){<option [value]="group.id">{{group.name}}</option>}</select></label>
<label class="text-sm">Производитель<input class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="editor()!.manufacturer||''" (input)="field('manufacturer',$event)"/></label><label class="text-sm">Артикул<input class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="editor()!.productCode||''" (input)="field('productCode',$event)"/></label>
<label class="text-sm">Толщина по умолчанию, мм<input type="number" class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="editor()!.defaultThicknessMm||''" (input)="numberField('defaultThicknessMm',$event)"/></label><label class="text-sm">Плотность, кг/м³<input type="number" class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="editor()!.densityKgM3||''" (input)="numberField('densityKgM3',$event)"/></label>
<label class="text-sm">Теплопроводность λ, Вт/(м·К)<input type="number" step="0.001" class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="editor()!.thermalConductivityWMK||''" (input)="numberField('thermalConductivityWMK',$event)"/></label><label class="text-sm">Удельная теплоёмкость, Дж/(кг·К)<input type="number" class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="editor()!.specificHeatJKgK||''" (input)="numberField('specificHeatJKgK',$event)"/></label>
<label class="text-sm">Коэффициент μ<input type="number" class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="editor()!.vaporResistanceFactor||''" (input)="numberField('vaporResistanceFactor',$event)"/></label><label class="text-sm">Прочность на сжатие, МПа<input type="number" step="0.1" class="mt-1 w-full rounded border border-[var(--sb-border)] bg-transparent p-2" [value]="editor()!.compressiveStrengthMPa||''" (input)="numberField('compressiveStrengthMPa',$event)"/></label>
</div><div class="mt-4 flex gap-2"><button class="rounded bg-[var(--sb-accent)] px-4 py-2 text-sm text-white" (click)="save()">Сохранить</button><button class="rounded border border-[var(--sb-border)] px-4 py-2 text-sm" (click)="editor.set(null)">Отмена</button></div></div>}
</div></section>`})
export class MaterialsPage{
 private readonly route=inject(ActivatedRoute);
 readonly groups=MATERIAL_GROUPS;
 readonly materials=signal<MaterialRecord[]>(loadMaterialCatalog());
 readonly query=toSignal(this.route.queryParamMap.pipe(map(params=>({group:params.get('group') as MaterialGroup|null,material:params.get('material')}))),{initialValue:{group:null,material:null}});
 readonly selectedMaterialId=computed(()=>this.query().material);
 readonly editor=signal<MaterialRecord|null>(null);
 readonly editingId=signal<string|null>(null);
 readonly filtered=computed(()=>{const group=this.query().group;return group?this.materials().filter(m=>m.group===group):this.materials();});
 startCreate(){const group=this.query().group??'wood';this.editingId.set(null);this.editor.set({id:'material-'+Date.now(),group,name:'Новый материал',color:'#8ab4f8'});}
 edit(m:MaterialRecord){this.editingId.set(m.id);this.editor.set({...m});}
 field(key:'name'|'group'|'manufacturer'|'productCode',e:Event){const value=(e.target as HTMLInputElement).value;this.editor.update(m=>m?{...m,[key]:value}:m);}
 numberField(key:'defaultThicknessMm'|'densityKgM3'|'thermalConductivityWMK'|'specificHeatJKgK'|'vaporResistanceFactor'|'compressiveStrengthMPa',e:Event){const raw=(e.target as HTMLInputElement).value;this.editor.update(m=>m?{...m,[key]:raw===''?undefined:Number(raw)}:m);}
 save(){const m=this.editor();if(!m||!m.name.trim())return;const list=this.materials();const next=this.editingId()?list.map(x=>x.id===m.id?m:x):[...list,m];this.materials.set(next);saveMaterialCatalog(next);this.editor.set(null);}
}
