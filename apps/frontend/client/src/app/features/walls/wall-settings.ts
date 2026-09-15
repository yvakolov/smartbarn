import { materialById } from '../materials/material-catalog';

export interface WallLayer { readonly id:number; readonly materialId:string; readonly thicknessMm:number; }
export interface WallSettingsModel{
  readonly version:2;
  readonly sideWallHeightMm:number;
  readonly roofPitchDeg:number;
  readonly layers:readonly WallLayer[];
}
interface LegacyWallSettingsModel{readonly version?:1;readonly externalWallThicknessMm?:number;}
interface PersistedWallSettingsCollection{readonly version:3;readonly byStoreyId:Record<string,WallSettingsModel>;}
export const WALL_SETTINGS_CHANGED_EVENT='smartbarn:wall-settings-changed';
const LEGACY_STORAGE_KEY='smartbarn.wall-settings.v1',PREVIOUS_STORAGE_KEY='smartbarn.wall-settings.v2',STORAGE_KEY='smartbarn.wall-settings.v3',DEFAULT_STOREY_ID='storey-1';
const DEFAULT_LAYERS:readonly WallLayer[]=[
  {id:1,materialId:'osb-3',thicknessMm:12},
  {id:2,materialId:'eps',thicknessMm:150},
  {id:3,materialId:'osb-3',thicknessMm:12},
];
export const DEFAULT_WALL_SETTINGS:WallSettingsModel={version:2,sideWallHeightMm:2500,roofPitchDeg:30,layers:DEFAULT_LAYERS};
function clamp(value:unknown,fallback:number,min:number,max:number){const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.round(n))):fallback;}
function normalizeLayer(value:unknown,index:number):WallLayer|undefined{if(!value||typeof value!=='object')return;const layer=value as Partial<WallLayer>;const materialId=typeof layer.materialId==='string'&&materialById(layer.materialId)?layer.materialId:'osb-3';return{id:clamp(layer.id,index+1,1,Number.MAX_SAFE_INTEGER),materialId,thicknessMm:clamp(layer.thicknessMm,materialById(materialId)?.defaultThicknessMm??12,1,2000)};}
function clone(model:WallSettingsModel):WallSettingsModel{return{...model,layers:model.layers.map(layer=>({...layer}))};}
function normalize(value:unknown):WallSettingsModel{const parsed=(value&&typeof value==='object'?value:{}) as Partial<WallSettingsModel>&LegacyWallSettingsModel;const layers=Array.isArray(parsed.layers)?parsed.layers.map(normalizeLayer).filter((x):x is WallLayer=>!!x):DEFAULT_LAYERS.map(x=>({...x}));return{version:2,sideWallHeightMm:clamp(parsed.sideWallHeightMm,2500,1000,6000),roofPitchDeg:clamp(parsed.roofPitchDeg,30,5,80),layers:layers.length?layers:DEFAULT_LAYERS.map(x=>({...x}))};}
function readCollection():PersistedWallSettingsCollection{if(typeof window==='undefined')return{version:3,byStoreyId:{[DEFAULT_STOREY_ID]:clone(DEFAULT_WALL_SETTINGS)}};try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const parsed=JSON.parse(raw) as Partial<PersistedWallSettingsCollection>;const byStoreyId:Record<string,WallSettingsModel>={};if(parsed.byStoreyId&&typeof parsed.byStoreyId==='object')for(const[id,value]of Object.entries(parsed.byStoreyId))byStoreyId[id]=normalize(value);return{version:3,byStoreyId};}const previousRaw=localStorage.getItem(PREVIOUS_STORAGE_KEY);if(previousRaw){const previous=JSON.parse(previousRaw) as {byStoreyId?:Record<string,unknown>};const byStoreyId:Record<string,WallSettingsModel>={};if(previous.byStoreyId)for(const id of Object.keys(previous.byStoreyId))byStoreyId[id]=clone(DEFAULT_WALL_SETTINGS);const migrated={version:3 as const,byStoreyId:Object.keys(byStoreyId).length?byStoreyId:{[DEFAULT_STOREY_ID]:clone(DEFAULT_WALL_SETTINGS)}};localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));return migrated;}const legacyRaw=localStorage.getItem(LEGACY_STORAGE_KEY);const migrated={version:3 as const,byStoreyId:{[DEFAULT_STOREY_ID]:legacyRaw?normalize(JSON.parse(legacyRaw)):clone(DEFAULT_WALL_SETTINGS)}};localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));return migrated;}catch{return{version:3,byStoreyId:{[DEFAULT_STOREY_ID]:clone(DEFAULT_WALL_SETTINGS)}};}}
export function loadWallSettings(storeyId=DEFAULT_STOREY_ID):WallSettingsModel{const collection=readCollection();return clone(collection.byStoreyId[storeyId]??collection.byStoreyId[DEFAULT_STOREY_ID]??DEFAULT_WALL_SETTINGS);}
export function saveWallSettings(settings:WallSettingsModel,storeyId=DEFAULT_STOREY_ID):void{if(typeof window==='undefined')return;const collection=readCollection();collection.byStoreyId[storeyId]=normalize(settings);localStorage.setItem(STORAGE_KEY,JSON.stringify(collection));window.dispatchEvent(new CustomEvent(WALL_SETTINGS_CHANGED_EVENT,{detail:{storeyId}}));}
export function cloneWallSettingsForStorey(sourceStoreyId:string,targetStoreyId:string):void{saveWallSettings(loadWallSettings(sourceStoreyId),targetStoreyId);}
export function removeWallSettingsForStorey(storeyId:string):void{if(typeof window==='undefined')return;const collection=readCollection();delete collection.byStoreyId[storeyId];localStorage.setItem(STORAGE_KEY,JSON.stringify(collection));window.dispatchEvent(new CustomEvent(WALL_SETTINGS_CHANGED_EVENT,{detail:{storeyId}}));}
export function wallThicknessMm(settings:WallSettingsModel):number{return settings.layers.reduce((sum,layer)=>sum+layer.thicknessMm,0);}
