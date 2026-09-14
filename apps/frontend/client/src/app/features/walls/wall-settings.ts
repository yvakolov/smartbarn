export interface WallSettingsModel{readonly version:1;readonly externalWallThicknessMm:number;}
export const WALL_SETTINGS_CHANGED_EVENT='smartbarn:wall-settings-changed';
const STORAGE_KEY='smartbarn.wall-settings.v1';
export const DEFAULT_WALL_SETTINGS:WallSettingsModel={version:1,externalWallThicknessMm:174};
function clamp(value:unknown,fallback:number){const n=Number(value);return Number.isFinite(n)?Math.min(1000,Math.max(50,Math.round(n))):fallback;}
export function loadWallSettings():WallSettingsModel{if(typeof window==='undefined')return DEFAULT_WALL_SETTINGS;try{const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return DEFAULT_WALL_SETTINGS;const parsed=JSON.parse(raw) as Partial<WallSettingsModel>;return{version:1,externalWallThicknessMm:clamp(parsed.externalWallThicknessMm,174)};}catch{return DEFAULT_WALL_SETTINGS;}}
export function saveWallSettings(settings:WallSettingsModel):void{if(typeof window==='undefined')return;localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));window.dispatchEvent(new CustomEvent(WALL_SETTINGS_CHANGED_EVENT));}
