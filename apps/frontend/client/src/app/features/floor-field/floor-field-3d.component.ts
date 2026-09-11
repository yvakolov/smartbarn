import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, signal } from '@angular/core';
import { ThreeDEngine, floorFieldToObject3D } from '@smartbarn/3d-engine';
import type { FloorFieldModel } from '@smartbarn/domain';
import * as THREE from 'three';

type NavigationMode = 'trackpad' | 'mouse';
interface FloorLayer3d { readonly id: number; readonly kind: string; readonly name: string; readonly thicknessMm: number; readonly color?: string; }
interface CameraState { readonly position: [number, number, number]; readonly target: [number, number, number]; readonly zoom: number; }

let savedCameraState: CameraState | undefined;
let savedNavigationMode: NavigationMode = 'trackpad';

@Component({
  selector: 'smartbarn-floor-field-3d', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="viewport-shell"><div class="viewport-toolbar"><button type="button" [class.active]="navigationMode() === 'trackpad'" (click)="setNavigationMode('trackpad')">Trackpad</button><button type="button" [class.active]="navigationMode() === 'mouse'" (click)="setNavigationMode('mouse')">Mouse</button><button type="button" (click)="fitView()">Center</button></div><div #viewport class="viewport"></div><div class="viewport-hint">{{ navigationMode() === 'trackpad' ? '1 finger move · 2 fingers rotate · pinch zoom' : 'Left rotate · Right move · Wheel zoom' }}</div></div>`,
  styles: `:host{display:block;width:100%;height:100%;min-height:0}.viewport-shell{position:relative;width:100%;height:100%;min-height:0;overflow:hidden;border-radius:var(--sb-radius-3);background:radial-gradient(circle at 50% 45%,var(--sb-accent-soft),transparent 42%),var(--sb-surface)}.viewport{width:100%;height:100%;min-height:0}.viewport-toolbar{position:absolute;z-index:3;top:.75rem;left:50%;transform:translateX(-50%);display:flex;gap:.35rem;padding:.3rem;border:1px solid var(--sb-border);border-radius:999px;background:color-mix(in srgb,var(--sb-surface-raised) 92%,transparent);backdrop-filter:blur(8px)}.viewport-toolbar button{border:0;border-radius:999px;padding:.42rem .72rem;background:transparent;color:var(--sb-text-muted);cursor:pointer}.viewport-toolbar button.active{background:var(--sb-accent-soft);color:var(--sb-text)}.viewport-hint{position:absolute;right:.75rem;bottom:.75rem;border:1px solid var(--sb-border);border-radius:var(--sb-radius-2);background:color-mix(in srgb,var(--sb-surface-raised) 88%,transparent);padding:.4rem .55rem;color:var(--sb-text-muted);font-size:.72rem;pointer-events:none;backdrop-filter:blur(8px)}`,
})
export class FloorField3dComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) lengthMm = 9_000; @Input({ required: true }) widthMm = 6_000; @Input({ required: true }) elevationMm = 0; @Input({ required: true }) layers: readonly FloorLayer3d[] = [];
  @ViewChild('viewport', { static: true }) private readonly viewport?: ElementRef<HTMLDivElement>;
  readonly navigationMode = signal<NavigationMode>(savedNavigationMode);
  private engine?: ThreeDEngine; private floorObject?: THREE.Object3D; private frameId?: number; private resizeObserver?: ResizeObserver; private hasInitialView = false;

  ngAfterViewInit(): void {
    const container=this.viewport?.nativeElement;if(!container)return;
    this.engine=new ThreeDEngine({container,antialias:true});
    this.engine.renderer.setClearColor(0x000000,0);
    this.engine.controls.minDistance=.5;
    this.engine.controls.maxDistance=200;
    const grid=new THREE.GridHelper(30,30,0x64748b,0x94a3b8);grid.position.y=-.002;grid.material.transparent=true;grid.material.opacity=.28;this.engine.scene.add(grid);
    this.resizeObserver=new ResizeObserver(()=>this.engine?.resize());this.resizeObserver.observe(container);
    this.engine.renderer.domElement.addEventListener('wheel',this.handleTrackpadWheel,{capture:true,passive:false});
    this.applyNavigationMode();this.rebuildScene();this.animate();
  }

  ngOnChanges(_changes:SimpleChanges):void{if(this.engine)this.rebuildScene();}

  ngOnDestroy():void{
    this.saveViewState();
    if(this.frameId!==undefined)cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
    this.engine?.renderer.domElement.removeEventListener('wheel',this.handleTrackpadWheel,true);
    this.disposeFloorObject();this.engine?.dispose();
  }

  setNavigationMode(mode:NavigationMode):void{this.navigationMode.set(mode);savedNavigationMode=mode;this.applyNavigationMode();}

  fitView():void{
    if(!this.engine||!this.floorObject)return;
    const box=new THREE.Box3().setFromObject(this.floorObject);
    if(box.isEmpty())return;
    const center=box.getCenter(new THREE.Vector3());
    const size=box.getSize(new THREE.Vector3());
    const camera=this.engine.camera;
    const vFov=THREE.MathUtils.degToRad(camera.fov);
    const hFov=2*Math.atan(Math.tan(vFov/2)*Math.max(camera.aspect,.001));
    const fitHeightDistance=(size.y+size.z*.7)/(2*Math.tan(vFov/2));
    const fitWidthDistance=(size.x+size.z*.35)/(2*Math.tan(hFov/2));
    const distance=Math.max(4,fitHeightDistance,fitWidthDistance,Math.max(size.x,size.z)*.82)*1.28;
    const direction=new THREE.Vector3(1,.72,1).normalize();
    camera.position.copy(center).addScaledVector(direction,distance);
    camera.zoom=1;
    camera.near=Math.max(.01,distance/1000);
    camera.far=Math.max(1000,distance*100);
    camera.updateProjectionMatrix();
    this.engine.controls.target.copy(center);
    camera.lookAt(center);
    this.engine.controls.update();
    this.hasInitialView=true;
    this.saveViewState();
  }

  private applyNavigationMode():void{
    if(!this.engine)return;
    const c=this.engine.controls;c.enableDamping=true;c.dampingFactor=.08;c.screenSpacePanning=true;
    if(this.navigationMode()==='trackpad'){
      c.mouseButtons.LEFT=THREE.MOUSE.PAN;c.mouseButtons.MIDDLE=THREE.MOUSE.DOLLY;c.mouseButtons.RIGHT=THREE.MOUSE.ROTATE;
      c.touches.ONE=THREE.TOUCH.PAN;c.touches.TWO=THREE.TOUCH.DOLLY_ROTATE;
      return;
    }
    c.mouseButtons.LEFT=THREE.MOUSE.ROTATE;c.mouseButtons.MIDDLE=THREE.MOUSE.DOLLY;c.mouseButtons.RIGHT=THREE.MOUSE.PAN;
    c.touches.ONE=THREE.TOUCH.ROTATE;c.touches.TWO=THREE.TOUCH.DOLLY_PAN;
  }

  private readonly handleTrackpadWheel=(event:WheelEvent):void=>{
    if(!this.engine||this.navigationMode()!=='trackpad'||event.ctrlKey)return;
    event.preventDefault();event.stopImmediatePropagation();
    const camera=this.engine.camera;const controls=this.engine.controls;
    const offset=camera.position.clone().sub(controls.target);
    const spherical=new THREE.Spherical().setFromVector3(offset);
    spherical.theta-=event.deltaX*.004;
    spherical.phi-=event.deltaY*.004;
    spherical.phi=THREE.MathUtils.clamp(spherical.phi,.08,Math.PI-.08);
    offset.setFromSpherical(spherical);
    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
    controls.update();
    this.saveViewState();
  };

  private rebuildScene():void{
    if(!this.engine)return;this.disposeFloorObject();
    const model:FloorFieldModel={id:'floor-field-preview',entity:'floor-field',geometry:{lengthMm:this.lengthMm,widthMm:this.widthMm,elevationMm:this.elevationMm},layers:this.layers.map((layer,index)=>({id:String(layer.id),name:layer.name,type:layer.kind,thicknessMm:layer.thicknessMm,color:layer.color??this.layerColor(layer.kind,index)}))};
    this.floorObject=floorFieldToObject3D(model);this.floorObject.position.y=this.elevationMm*.001;this.engine.root.add(this.floorObject);
    if(!this.hasInitialView){
      if(savedCameraState)this.restoreViewState(savedCameraState);else this.fitView();
      this.hasInitialView=true;
    }
  }

  private restoreViewState(state:CameraState):void{
    if(!this.engine)return;
    const camera=this.engine.camera;
    camera.position.fromArray(state.position);
    camera.zoom=state.zoom;
    camera.updateProjectionMatrix();
    this.engine.controls.target.fromArray(state.target);
    camera.lookAt(this.engine.controls.target);
    this.engine.controls.update();
  }

  private saveViewState():void{
    if(!this.engine)return;
    savedCameraState={position:this.engine.camera.position.toArray() as [number,number,number],target:this.engine.controls.target.toArray() as [number,number,number],zoom:this.engine.camera.zoom};
  }

  private animate=():void=>{this.engine?.render();this.frameId=requestAnimationFrame(this.animate);};
  private disposeFloorObject():void{if(!this.floorObject||!this.engine)return;this.engine.root.remove(this.floorObject);this.floorObject.traverse((object)=>{if(!(object instanceof THREE.Mesh))return;object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach((material)=>material.dispose());});this.floorObject=undefined;}
  private layerColor(kind:string,index:number):string{const colors:Record<string,string>={sip:'#d9b36c',finish:'#c58d5b',screed:'#a8a29e',insulation:'#eab308',structure:'#64748b',ceiling:'#e2e8f0',custom:'#38bdf8'};return colors[kind]??['#38bdf8','#a78bfa','#34d399'][index%3];}
}
