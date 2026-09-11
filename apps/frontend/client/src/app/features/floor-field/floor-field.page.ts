import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FloorField3dComponent } from './floor-field-3d.component';
import { FloorFieldPreferencesStore, type FloorFieldViewPreference } from './floor-field-preferences.store';
import { FloorFieldStore } from './floor-field.store';

type ResizeHandle = 'length' | 'width' | 'both';
interface PreviewRect { readonly x:number; readonly y:number; readonly width:number; readonly height:number; }

@Component({selector:'smartbarn-floor-field-page',standalone:true,imports:[FloorField3dComponent],changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./floor-field.page.html',styleUrl:'./floor-field.page.scss'})
export class FloorFieldPage {
 private static readonly MIN=500; private static readonly MAX=50000; private draggedLayerId:number|null=null; private dragResizeState:{handle:ResizeHandle;startX:number;startY:number;startLength:number;startWidth:number}|null=null;
 private readonly store=inject(FloorFieldStore); private readonly preferences=inject(FloorFieldPreferencesStore);
 readonly lengthMm=this.store.lengthMm; readonly widthMm=this.store.widthMm; readonly elevationMm=this.store.elevationMm; readonly layers=this.store.layers; readonly totalLayerThicknessMm=this.store.totalLayerThicknessMm;
 readonly gridStepMm=this.preferences.gridStepMm; readonly snapToGrid=this.preferences.snapToGrid; readonly activeView=this.preferences.activeView; readonly inspectorOpen=this.preferences.inspectorOpen; readonly show3dGrid=this.preferences.show3dGrid; readonly navigationMode=this.preferences.navigationMode; readonly camera=this.preferences.camera; readonly hiddenLayerIds=this.preferences.hiddenLayerIds;
 readonly dragOverLayerId=signal<number|null>(null); readonly dragOverPosition=signal<'before'|'after'|null>(null);
 readonly previewRect=computed<PreviewRect>(()=>{const aw=760,ah=500,a=this.lengthMm()/this.widthMm(),aa=aw/ah,w=a>=aa?aw:ah*a,h=a>=aa?aw/a:ah;return{x:(1000-w)/2,y:(650-h)/2,width:w,height:h};});

 constructor(){this.store.initialize();this.preferences.initialize();}

 setActiveView(v:FloorFieldViewPreference){this.preferences.setActiveView(v);} toggleInspector(){this.preferences.setInspectorOpen(!this.inspectorOpen());} toggleSnapToGrid(){this.preferences.setSnapToGrid(!this.snapToGrid());} toggle3dGrid(){this.preferences.setShow3dGrid(!this.show3dGrid());}
 updateLength(e:Event){this.store.setLength(this.snap(this.read(e,this.lengthMm(),FloorFieldPage.MIN,FloorFieldPage.MAX)));} updateWidth(e:Event){this.store.setWidth(this.snap(this.read(e,this.widthMm(),FloorFieldPage.MIN,FloorFieldPage.MAX)));} updateElevation(e:Event){this.store.setElevation(this.read(e,this.elevationMm(),-10000,50000));} updateGridStep(e:Event){this.preferences.setGridStepMm(this.read(e,this.gridStepMm(),10,5000));}
 swapDimensions(){this.store.swapDimensions();} resetGeometry(){this.store.resetGeometry();this.preferences.setGridStepMm(100);this.preferences.setSnapToGrid(true);} resetWorkspace(){this.preferences.resetWorkspace();}
 startResize(handle:ResizeHandle,e:PointerEvent){e.preventDefault();(e.currentTarget as Element).setPointerCapture?.(e.pointerId);this.dragResizeState={handle,startX:e.clientX,startY:e.clientY,startLength:this.lengthMm(),startWidth:this.widthMm()};}
 resizeGeometry(e:PointerEvent){const s=this.dragResizeState;if(!s)return;const r=this.previewRect(),pxL=r.width/s.startLength,pxW=r.height/s.startWidth;if(s.handle!=='width')this.store.setLength(this.snap(s.startLength+(e.clientX-s.startX)/Math.max(pxL,.0001)));if(s.handle!=='length')this.store.setWidth(this.snap(s.startWidth+(e.clientY-s.startY)/Math.max(pxW,.0001)));} stopResize(){this.dragResizeState=null;}
 addLayer(position:'top'|'bottom'){this.store.addLayer(position);} removeLayer(id:number){this.store.removeLayer(id);}
 updateLayerName(id:number,e:Event){const name=(e.target as HTMLInputElement).value||'Слой';this.store.updateLayer(id,{name});} updateLayerColor(id:number,e:Event){const color=(e.target as HTMLInputElement).value;this.store.updateLayer(id,{color});} updateLayerThickness(id:number,e:Event){const layer=this.layers().find(item=>item.id===id);if(!layer)return;this.store.updateLayer(id,{thicknessMm:this.read(e,layer.thicknessMm,1,2000)});}
 isLayerVisible(id:number){return !this.hiddenLayerIds().includes(id);} setLayerVisible(id:number,e:Event){this.preferences.setLayerVisible(id,(e.target as HTMLInputElement).checked);} showAllLayers(){this.preferences.showAllLayers();} hideAllLayers(){this.preferences.hideAllLayers(this.layers().map(layer=>layer.id));}
 onNavigationModeChange(mode:'trackpad'|'mouse'){this.preferences.setNavigationMode(mode);} onCameraChange(camera:{position:[number,number,number];target:[number,number,number];zoom:number}){this.preferences.setCamera(camera);}
 startLayerDrag(id:number,e:DragEvent){this.draggedLayerId=id;e.dataTransfer?.setData('text/plain',String(id));} allowLayerDrop(id:number,e:DragEvent){e.preventDefault();const b=(e.currentTarget as HTMLElement).getBoundingClientRect();this.dragOverLayerId.set(id);this.dragOverPosition.set(e.clientY<b.top+b.height/2?'before':'after');} dropLayer(id:number,e:DragEvent){e.preventDefault();const src=this.draggedLayerId??Number(e.dataTransfer?.getData('text/plain')),pos=this.dragOverPosition()??'before';this.endLayerDrag();if(src===id)return;this.store.reorderLayers(src,id,pos);} endLayerDrag(){this.draggedLayerId=null;this.dragOverLayerId.set(null);this.dragOverPosition.set(null);}
 private snap(v:number){const step=this.gridStepMm();const n=this.snapToGrid()?Math.round(v/step)*step:Math.round(v);return Math.min(FloorFieldPage.MAX,Math.max(FloorFieldPage.MIN,n));} private read(e:Event,f:number,min:number,max:number){const v=Number((e.target as HTMLInputElement).value);return Number.isFinite(v)?Math.min(max,Math.max(min,Math.round(v))):f;}
}
