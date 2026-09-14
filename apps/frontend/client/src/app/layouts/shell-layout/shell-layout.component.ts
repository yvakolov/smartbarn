import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  lucideArrowDownUp,
  lucideChevronRight,
  lucideHouse,
  lucideLibrary,
  lucidePanelLeft,
  lucideSettings,
} from '@smartbarn/icons';
import { IconComponent, provideIcons } from '@smartbarn/ui-kit';
import { BUILDING_STRUCTURE_CHANGED_EVENT, loadBuildingStructure, storeyTopElevationMm, type BuildingStructureModel } from '../../features/building-structure/building-structure';
import { MATERIAL_CATALOG_CHANGED_EVENT, MATERIAL_GROUPS, loadMaterialCatalog, type MaterialGroup, type MaterialRecord } from '../../features/materials/material-catalog';

type Workspace='house'|'materials'|'exchange'|'settings';

@Component({selector:'sb-shell-layout',standalone:true,imports:[RouterOutlet,RouterLink,RouterLinkActive,TranslocoPipe,IconComponent],providers:[...provideIcons(lucidePanelLeft,lucideHouse,lucideLibrary,lucideArrowDownUp,lucideSettings,lucideChevronRight)],template:`
<div class="h-dvh overflow-hidden bg-[var(--sb-bg)] text-[var(--sb-text)]"><header class="flex h-14 items-center border-b border-[var(--sb-border)] bg-[var(--sb-surface)] px-3"><button class="mr-2 flex items-center justify-center rounded px-2 py-1 text-xl hover:bg-[var(--sb-gray-3)]" (click)="toggleSidebar()" [title]="'shell.navigation'|transloco"><sb-icon name="panelLeft" /></button><strong class="text-sm">{{'app.name'|transloco}}</strong><span class="ml-auto hidden text-xs text-[var(--sb-text-muted)] sm:inline">{{'shell.platform'|transloco}}</span></header>
<div class="grid h-[calc(100dvh-56px)] transition-[grid-template-columns] duration-150" [style.grid-template-columns]="sidebarOpen()?'52px 260px minmax(0,1fr)':'52px 0 minmax(0,1fr)'">
<aside class="relative z-20 border-r border-[var(--sb-border)] bg-[var(--sb-surface)]"><nav class="flex h-full w-[52px] flex-col items-center gap-1 py-2">
@for(space of spaces;track space.id){<button class="group relative flex h-11 w-11 items-center justify-center rounded-lg text-xl" [class.mt-auto]="space.id==='settings'" [class.bg-[var(--sb-accent-soft)]]="activeSpace()===space.id" (click)="selectSpace(space.id)" [attr.aria-label]="space.labelKey|transloco"><sb-icon [name]="space.icon" /><span class="pointer-events-none absolute left-full ml-2 hidden whitespace-nowrap rounded bg-[var(--sb-text)] px-2 py-1 text-xs text-[var(--sb-bg)] shadow-lg group-hover:block">{{space.labelKey|transloco}}</span></button>}
</nav>@if(touchLabelKey()){<div class="pointer-events-none absolute left-[58px] top-3 z-50 whitespace-nowrap rounded bg-[var(--sb-text)] px-2 py-1 text-xs text-[var(--sb-bg)] shadow-lg md:hidden">{{touchLabelKey()|transloco}}</div>}</aside>
<aside class="overflow-hidden border-r border-[var(--sb-border)] bg-[var(--sb-surface)]"><nav class="flex h-full w-[260px] flex-col gap-1 overflow-auto p-3 text-sm"><div class="mb-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--sb-text-muted)]">{{spaceTitleKey()|transloco}}</div>
@switch(activeSpace()){
  @case('house'){
    <a routerLink="/app/foundation" routerLinkActive="bg-[var(--sb-accent-soft)] text-[var(--sb-text)]" class="block rounded px-3 py-2 text-[var(--sb-text-muted)]">{{'structure.foundation'|transloco}}</a>
    <details class="group/tree rounded" open>
      <summary class="cursor-pointer list-none rounded px-3 py-2 text-[var(--sb-text-muted)] hover:bg-[var(--sb-gray-3)]"><sb-icon name="chevronRight" class="mr-1 transition-transform group-open/tree:rotate-90" />{{'structure.storeys'|transloco}}</summary>
      <div class="ml-5 border-l border-[var(--sb-border)] pl-2">
        <a routerLink="/app/storeys" routerLinkActive="bg-[var(--sb-accent-soft)] text-[var(--sb-text)]" class="mb-1 block rounded px-3 py-1.5 text-xs text-[var(--sb-text-muted)]">{{'structure.manageStoreys'|transloco}}</a>
        @for(storey of buildingStructure().storeys;track storey.id;let i=$index){
          <details class="group/storey rounded" open>
            <summary class="cursor-pointer list-none rounded px-3 py-1.5 text-[var(--sb-text-muted)] hover:bg-[var(--sb-gray-3)]"><sb-icon name="chevronRight" class="mr-1 transition-transform group-open/storey:rotate-90" />{{'structure.storey'|transloco}} {{i+1}} <span class="float-right text-[10px] opacity-70">+{{storey.baseElevationMm/1000}} / +{{storeyTop(storey.id)/1000}} м</span></summary>
            <div class="ml-5 border-l border-[var(--sb-border)] pl-2">
              <a routerLink="/app/floor-field" [queryParams]="{storey:storey.id}" routerLinkActive="bg-[var(--sb-accent-soft)] text-[var(--sb-text)]" class="block rounded px-3 py-1.5 text-xs text-[var(--sb-text-muted)]">{{'shell.floorField'|transloco}}</a>
              <div class="rounded px-3 py-1.5 text-xs text-[var(--sb-text-muted)] opacity-70">{{'shell.walls'|transloco}} <span class="float-right">{{'shell.soon'|transloco}}</span></div>
            </div>
          </details>
        }
      </div>
    </details>
    <div class="rounded px-3 py-2 text-[var(--sb-text-muted)] opacity-70">{{'shell.roof'|transloco}} <span class="float-right text-xs">{{'shell.soon'|transloco}}</span></div>
  }
  @case('materials'){
    <div class="space-y-1">
      @for(group of materialGroups;track group.id){
        <details class="group/tree rounded" open>
          <summary class="cursor-pointer list-none rounded px-3 py-2 text-[var(--sb-text-muted)] hover:bg-[var(--sb-gray-3)]">
            <sb-icon name="chevronRight" class="mr-1 transition-transform group-open/tree:rotate-90" />{{('materials.groups.'+group.id)|transloco}}
          </summary>
          <div class="ml-5 border-l border-[var(--sb-border)] pl-2">
            @for(material of materialsForGroup(group.id);track material.id){
              <a routerLink="/app/materials" [queryParams]="{group:group.id,material:material.id}" class="block truncate rounded px-3 py-1.5 text-xs text-[var(--sb-text-muted)] hover:bg-[var(--sb-gray-3)] hover:text-[var(--sb-text)]">{{material.name}}</a>
            }
            @if(!materialsForGroup(group.id).length){<div class="px-3 py-1.5 text-xs text-[var(--sb-text-muted)] opacity-60">{{'shell.noMaterials'|transloco}}</div>}
          </div>
        </details>
      }
    </div>
  }
  @case('exchange'){
    <a routerLink="/app/exchange/import" routerLinkActive="bg-[var(--sb-accent-soft)]" class="rounded px-3 py-2 text-[var(--sb-text-muted)]">{{'shell.import'|transloco}}</a>
    <a routerLink="/app/exchange/export" routerLinkActive="bg-[var(--sb-accent-soft)]" class="rounded px-3 py-2 text-[var(--sb-text-muted)]">{{'shell.export'|transloco}}</a>
  }
  @case('settings'){
    <a routerLink="/app/settings" routerLinkActive="bg-[var(--sb-accent-soft)]" class="rounded px-3 py-2 text-[var(--sb-text-muted)]">{{'shell.general'|transloco}}</a>
  }
}</nav></aside><main class="min-h-0 min-w-0 overflow-hidden"><router-outlet/></main></div></div>`,changeDetection:ChangeDetectionStrategy.OnPush})
export class ShellLayoutComponent implements OnDestroy{
  private readonly router=inject(Router);
  readonly sidebarOpen=signal(true);
  readonly activeSpace=signal<Workspace>(this.spaceFromUrl(this.router.url));
  readonly touchLabelKey=signal('');
  readonly materialGroups=MATERIAL_GROUPS;
  readonly materials=signal<MaterialRecord[]>(loadMaterialCatalog());
  readonly buildingStructure=signal<BuildingStructureModel>(loadBuildingStructure());
  private touchTimer?:ReturnType<typeof setTimeout>;
  private readonly refreshMaterials=()=>this.materials.set(loadMaterialCatalog());
  private readonly refreshBuildingStructure=()=>this.buildingStructure.set(loadBuildingStructure());
  readonly spaces:ReadonlyArray<{id:Workspace;labelKey:string;icon:string}>=[{id:'house',labelKey:'shell.house',icon:'house'},{id:'materials',labelKey:'shell.materials',icon:'library'},{id:'exchange',labelKey:'shell.exchange',icon:'arrowDownUp'},{id:'settings',labelKey:'shell.settings',icon:'settings'}];

  constructor(){if(typeof window!=='undefined'){window.addEventListener(MATERIAL_CATALOG_CHANGED_EVENT,this.refreshMaterials);window.addEventListener(BUILDING_STRUCTURE_CHANGED_EVENT,this.refreshBuildingStructure);}}
  ngOnDestroy():void{if(typeof window!=='undefined'){window.removeEventListener(MATERIAL_CATALOG_CHANGED_EVENT,this.refreshMaterials);window.removeEventListener(BUILDING_STRUCTURE_CHANGED_EVENT,this.refreshBuildingStructure);}if(this.touchTimer)clearTimeout(this.touchTimer);}
  toggleSidebar(){this.sidebarOpen.update(v=>!v);}
  selectSpace(s:Workspace){this.activeSpace.set(s);if(s==='materials')this.refreshMaterials();if(s==='house')this.refreshBuildingStructure();this.touchLabelKey.set(this.labelKeyForSpace(s));if(this.touchTimer)clearTimeout(this.touchTimer);this.touchTimer=setTimeout(()=>this.touchLabelKey.set(''),1100);void this.router.navigateByUrl(this.defaultUrl(s));}
  spaceTitleKey(){return this.labelKeyForSpace(this.activeSpace());}
  materialsForGroup(group:MaterialGroup){return this.materials().filter(material=>material.group===group);}
  storeyTop(id:string){const storey=this.buildingStructure().storeys.find(item=>item.id===id);return storey?storeyTopElevationMm(storey):0;}
  private defaultUrl(s:Workspace){return s==='house'?'/app/foundation':s==='materials'?'/app/materials':s==='exchange'?'/app/exchange/import':'/app/settings';}
  private labelKeyForSpace(s:Workspace){return this.spaces.find(x=>x.id===s)?.labelKey??'';}
  private spaceFromUrl(url:string):Workspace{return url.includes('/materials')?'materials':url.includes('/exchange')||url.includes('/import-export')?'exchange':url.includes('/settings')?'settings':'house';}
}
