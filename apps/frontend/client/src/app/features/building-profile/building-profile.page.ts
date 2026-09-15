import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BUILDING_STRUCTURE_CHANGED_EVENT, loadBuildingStructure, type BuildingStructureModel } from '../building-structure/building-structure';
import { FLOOR_FIELD_CHANGED_EVENT, loadFloorField } from '../floor-field/floor-field.store';
import { loadWallSettings, WALL_SETTINGS_CHANGED_EVENT, wallThicknessMm } from '../walls/wall-settings';

type ProfileSelection={type:'foundation'}|{type:'floor'|'walls';storeyId:string};
@Component({selector:'smartbarn-building-profile-page',standalone:true,templateUrl:'./building-profile.page.html',styleUrl:'./building-profile.page.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class BuildingProfilePage implements OnDestroy{
 private readonly router=inject(Router);readonly structure=signal<BuildingStructureModel>(loadBuildingStructure());readonly selection=signal<ProfileSelection|null>(null);
 readonly profile=computed(()=>{const structure=this.structure();const storeys=structure.storeys.map(storey=>{const floor=loadFloorField(storey.id),walls=loadWallSettings(storey.id);return{...storey,floorThicknessMm:floor.layers.reduce((s,l)=>s+l.thicknessMm,0),wallThicknessMm:wallThicknessMm(walls),wallHeightMm:walls.sideWallHeightMm,roofPitchDeg:walls.roofPitchDeg,layers:floor.layers,wallLayers:walls.layers};});const top=storeys.at(-1);const width=top?loadFloorField(top.id).widthMm:6000;const pitch=top?loadWallSettings(top.id).roofPitchDeg:30;const rise=width/2*Math.tan(pitch*Math.PI/180);return{structure,storeys,roof:{pitch,width,rise}};});
 readonly maxElevation=computed(()=>{const p=this.profile(),last=p.storeys.at(-1);return(last?last.baseElevationMm+last.heightMm:0)+p.roof.rise;});readonly minElevation=computed(()=>this.profile().structure.foundation.baseElevationMm);
 private readonly refresh=()=>this.structure.set(loadBuildingStructure());
 constructor(){if(typeof window!=='undefined'){window.addEventListener(BUILDING_STRUCTURE_CHANGED_EVENT,this.refresh);window.addEventListener(FLOOR_FIELD_CHANGED_EVENT,this.refresh);window.addEventListener(WALL_SETTINGS_CHANGED_EVENT,this.refresh);}}
 ngOnDestroy(){if(typeof window!=='undefined'){window.removeEventListener(BUILDING_STRUCTURE_CHANGED_EVENT,this.refresh);window.removeEventListener(FLOOR_FIELD_CHANGED_EVENT,this.refresh);window.removeEventListener(WALL_SETTINGS_CHANGED_EVENT,this.refresh);}}
 y(elevation:number){const min=this.minElevation(),range=Math.max(1,this.maxElevation()-min);return 620-(elevation-min)/range*520;}
 h(mm:number){const range=Math.max(1,this.maxElevation()-this.minElevation());return Math.max(3,mm/range*520);}
 select(selection:ProfileSelection){this.selection.set(selection);}
 isSelected(type:ProfileSelection['type'],storeyId?:string){const s=this.selection();return!!s&&s.type===type&&(!storeyId||('storeyId'in s&&s.storeyId===storeyId));}
 open(selection:ProfileSelection){if(selection.type==='foundation'){void this.router.navigate(['/app/foundation']);return;}void this.router.navigate([selection.type==='floor'?'/app/floor-field':'/app/walls'],{queryParams:{storey:selection.storeyId}});}
 materialName(id:string){return id==='eps'?'EPS':id==='osb-3'?'OSB-3':id;}
}
