import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ThreeDEngine, floorFieldToObject3D, type CameraMode } from '@smartbarn/3d-engine';
import type { FloorFieldModel } from '@smartbarn/domain';
import * as THREE from 'three';

type NavigationMode = 'trackpad' | 'mouse';
type StandardView = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right';

interface FloorLayer3d {
  readonly id: number;
  readonly kind: string;
  readonly name: string;
  readonly thicknessMm: number;
  readonly color?: string;
}

export interface CameraState {
  readonly position: [number, number, number];
  readonly target: [number, number, number];
  readonly zoom: number;
}

@Component({
  selector: 'smartbarn-floor-field-3d',
  standalone: true,
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="viewport-shell">
    <div class="viewport-toolbar">
      <button type="button" [class.active]="navigationMode() === 'trackpad'" (click)="setNavigationMode('trackpad')">Trackpad</button>
      <button type="button" [class.active]="navigationMode() === 'mouse'" (click)="setNavigationMode('mouse')">Mouse</button>
      <button type="button" (click)="fitView()">Center</button>
      <button type="button" (click)="resetView()">Top</button>
    </div>

    <div class="view-cube-shell" [attr.aria-label]="'floorField.viewCube.navigation' | transloco">
      <button class="nav home" type="button" (click)="fitView()" title="Home">⌂</button>
      <button class="nav left-arrow" type="button" (click)="stepOrbit(-1, 0)" aria-label="Rotate left">‹</button>
      <button class="nav right-arrow" type="button" (click)="stepOrbit(1, 0)" aria-label="Rotate right">›</button>
      <button class="nav up-arrow" type="button" (click)="stepOrbit(0, -1)" aria-label="Rotate up">⌃</button>
      <button class="nav down-arrow" type="button" (click)="stepOrbit(0, 1)" aria-label="Rotate down">⌄</button>
      <button class="nav roll-left" type="button" (click)="rollView(-1)" aria-label="Roll left">↶</button>
      <button class="nav roll-right" type="button" (click)="rollView(1)" aria-label="Roll right">↷</button>

      <div
        class="view-cube-stage"
        (pointerdown)="startCubeDrag($event)"
        (pointermove)="moveCubeDrag($event)"
        (pointerup)="endCubeDrag($event)"
        (pointercancel)="endCubeDrag($event)"
      >
        <div class="cube-rig" [class.dragging]="cubeDragging()" [style.transform]="cubeTransform()">
          <div class="axis-edge axis-x"><span>X</span></div>
          <div class="axis-edge axis-y"><span>Y</span></div>
          <div class="axis-edge axis-z"><span>Z</span></div>

          <div class="face front">
            <button class="zone corner tl" (click)="selectDirection(-1, 1, 1, $event)"></button>
            <button class="zone edge t" (click)="selectDirection(0, 1, 1, $event)"></button>
            <button class="zone corner tr" (click)="selectDirection(1, 1, 1, $event)"></button>
            <button class="zone edge l" (click)="selectDirection(-1, 0, 1, $event)"></button>
            <button class="zone center" (click)="selectView('front', $event)">{{ 'floorField.viewCube.front' | transloco }}</button>
            <button class="zone edge r" (click)="selectDirection(1, 0, 1, $event)"></button>
            <button class="zone corner bl" (click)="selectDirection(-1, -1, 1, $event)"></button>
            <button class="zone edge b" (click)="selectDirection(0, -1, 1, $event)"></button>
            <button class="zone corner br" (click)="selectDirection(1, -1, 1, $event)"></button>
          </div>

          <div class="face back">
            <button class="zone corner tl" (click)="selectDirection(1, 1, -1, $event)"></button>
            <button class="zone edge t" (click)="selectDirection(0, 1, -1, $event)"></button>
            <button class="zone corner tr" (click)="selectDirection(-1, 1, -1, $event)"></button>
            <button class="zone edge l" (click)="selectDirection(1, 0, -1, $event)"></button>
            <button class="zone center" (click)="selectView('back', $event)">{{ 'floorField.viewCube.back' | transloco }}</button>
            <button class="zone edge r" (click)="selectDirection(-1, 0, -1, $event)"></button>
            <button class="zone corner bl" (click)="selectDirection(1, -1, -1, $event)"></button>
            <button class="zone edge b" (click)="selectDirection(0, -1, -1, $event)"></button>
            <button class="zone corner br" (click)="selectDirection(-1, -1, -1, $event)"></button>
          </div>

          <div class="face right">
            <button class="zone corner tl" (click)="selectDirection(1, 1, 1, $event)"></button>
            <button class="zone edge t" (click)="selectDirection(1, 1, 0, $event)"></button>
            <button class="zone corner tr" (click)="selectDirection(1, 1, -1, $event)"></button>
            <button class="zone edge l" (click)="selectDirection(1, 0, 1, $event)"></button>
            <button class="zone center" (click)="selectView('right', $event)">{{ 'floorField.viewCube.right' | transloco }}</button>
            <button class="zone edge r" (click)="selectDirection(1, 0, -1, $event)"></button>
            <button class="zone corner bl" (click)="selectDirection(1, -1, 1, $event)"></button>
            <button class="zone edge b" (click)="selectDirection(1, -1, 0, $event)"></button>
            <button class="zone corner br" (click)="selectDirection(1, -1, -1, $event)"></button>
          </div>

          <div class="face left">
            <button class="zone corner tl" (click)="selectDirection(-1, 1, -1, $event)"></button>
            <button class="zone edge t" (click)="selectDirection(-1, 1, 0, $event)"></button>
            <button class="zone corner tr" (click)="selectDirection(-1, 1, 1, $event)"></button>
            <button class="zone edge l" (click)="selectDirection(-1, 0, -1, $event)"></button>
            <button class="zone center" (click)="selectView('left', $event)">{{ 'floorField.viewCube.left' | transloco }}</button>
            <button class="zone edge r" (click)="selectDirection(-1, 0, 1, $event)"></button>
            <button class="zone corner bl" (click)="selectDirection(-1, -1, -1, $event)"></button>
            <button class="zone edge b" (click)="selectDirection(-1, -1, 0, $event)"></button>
            <button class="zone corner br" (click)="selectDirection(-1, -1, 1, $event)"></button>
          </div>

          <div class="face top">
            <button class="zone corner tl" (click)="selectDirection(-1, 1, -1, $event)"></button>
            <button class="zone edge t" (click)="selectDirection(0, 1, -1, $event)"></button>
            <button class="zone corner tr" (click)="selectDirection(1, 1, -1, $event)"></button>
            <button class="zone edge l" (click)="selectDirection(-1, 1, 0, $event)"></button>
            <button class="zone center" (click)="selectView('top', $event)">{{ 'floorField.viewCube.top' | transloco }}</button>
            <button class="zone edge r" (click)="selectDirection(1, 1, 0, $event)"></button>
            <button class="zone corner bl" (click)="selectDirection(-1, 1, 1, $event)"></button>
            <button class="zone edge b" (click)="selectDirection(0, 1, 1, $event)"></button>
            <button class="zone corner br" (click)="selectDirection(1, 1, 1, $event)"></button>
          </div>

          <div class="face bottom">
            <button class="zone corner tl" (click)="selectDirection(-1, -1, 1, $event)"></button>
            <button class="zone edge t" (click)="selectDirection(0, -1, 1, $event)"></button>
            <button class="zone corner tr" (click)="selectDirection(1, -1, 1, $event)"></button>
            <button class="zone edge l" (click)="selectDirection(-1, -1, 0, $event)"></button>
            <button class="zone center" (click)="selectView('bottom', $event)">{{ 'floorField.viewCube.bottom' | transloco }}</button>
            <button class="zone edge r" (click)="selectDirection(1, -1, 0, $event)"></button>
            <button class="zone corner bl" (click)="selectDirection(-1, -1, -1, $event)"></button>
            <button class="zone edge b" (click)="selectDirection(0, -1, -1, $event)"></button>
            <button class="zone corner br" (click)="selectDirection(1, -1, -1, $event)"></button>
          </div>
        </div>
      </div>
    </div>

    <div #viewport class="viewport"></div>
    <div class="viewport-hint">
      {{ navigationMode() === 'trackpad' ? '1 finger move · 2 fingers orbit · pinch zoom' : 'Middle drag orbit · Shift + Middle pan · Wheel zoom' }}
    </div>
  </div>`,
  styles: `
    :host{display:block;width:100%;height:100%;min-height:0}.viewport-shell{position:relative;width:100%;height:100%;min-height:0;overflow:hidden;border-radius:var(--sb-radius-3);background:radial-gradient(circle at 50% 45%,var(--sb-accent-soft),transparent 42%),var(--sb-surface)}.viewport{width:100%;height:100%;min-height:0}.viewport-toolbar{position:absolute;z-index:4;top:.75rem;left:50%;transform:translateX(-50%);display:flex;gap:.35rem;padding:.3rem;border:1px solid var(--sb-border);border-radius:999px;background:color-mix(in srgb,var(--sb-surface-raised) 92%,transparent);backdrop-filter:blur(8px)}.viewport-toolbar button{border:0;border-radius:999px;padding:.42rem .72rem;background:transparent;color:var(--sb-text-muted);cursor:pointer}.viewport-toolbar button.active{background:var(--sb-accent-soft);color:var(--sb-text)}.viewport-hint{position:absolute;right:.75rem;bottom:.75rem;padding:.4rem .55rem;color:var(--sb-text-muted);font-size:.72rem}
    .view-cube-shell{position:absolute;z-index:6;top:14px;right:18px;width:154px;height:156px;pointer-events:none;user-select:none}.view-cube-stage{position:absolute;top:28px;right:30px;width:92px;height:92px;display:grid;place-items:center;perspective:560px;pointer-events:auto;cursor:grab;touch-action:none}.view-cube-stage:active{cursor:grabbing}.cube-rig{position:relative;width:64px;height:64px;transform-style:preserve-3d;transition:transform .14s ease}.cube-rig.dragging{transition:none}.face{position:absolute;inset:0;transform-style:preserve-3d;border:1px solid #9ea5ac;background:linear-gradient(135deg,#fbfbfb 0%,#d9dde0 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.75),0 1px 4px rgba(0,0,0,.16);backface-visibility:hidden}.front{transform:translateZ(32px)}.back{transform:rotateY(180deg) translateZ(32px)}.right{transform:rotateY(90deg) translateZ(32px)}.left{transform:rotateY(-90deg) translateZ(32px)}.top{transform:rotateX(90deg) translateZ(32px)}.bottom{transform:rotateX(-90deg) translateZ(32px)}
    .zone{position:absolute;border:0;background:transparent;color:#3d4349;cursor:pointer;padding:0;font:700 9px/1 system-ui;letter-spacing:.01em;display:grid;place-items:center}.zone.center{left:18%;top:18%;width:64%;height:64%;z-index:1}.zone.center:hover{background:rgba(52,152,219,.24);box-shadow:inset 0 0 0 1px rgba(52,152,219,.65)}.zone.edge{z-index:2}.zone.edge.t{left:20%;top:0;width:60%;height:20%}.zone.edge.b{left:20%;bottom:0;width:60%;height:20%}.zone.edge.l{left:0;top:20%;width:20%;height:60%}.zone.edge.r{right:0;top:20%;width:20%;height:60%}.zone.edge:hover{background:transparent}.zone.edge::after{content:'';position:absolute;background:#56b7f5;opacity:0}.zone.edge:hover::after{opacity:1}.zone.edge.t::after{left:0;right:0;top:0;height:3px}.zone.edge.b::after{left:0;right:0;bottom:0;height:3px}.zone.edge.l::after{left:0;top:0;bottom:0;width:3px}.zone.edge.r::after{right:0;top:0;bottom:0;width:3px}.zone.corner{width:22%;height:22%;z-index:3}.zone.corner.tl{left:0;top:0}.zone.corner.tr{right:0;top:0}.zone.corner.bl{left:0;bottom:0}.zone.corner.br{right:0;bottom:0}.zone.corner:hover{background:#56b7f5;box-shadow:0 0 0 1px rgba(40,120,180,.8)}
    .axis-edge{position:absolute;height:2px;transform-origin:left center;pointer-events:none}.axis-edge span{position:absolute;font:700 11px/1 system-ui}.axis-x{width:42px;background:#e53935;left:-32px;top:64px;transform:translateZ(32px)}.axis-x span{left:45px;top:-4px;color:#e53935}.axis-z{width:42px;background:#3949ab;left:0;top:64px;transform:translateZ(32px) rotateZ(-90deg)}.axis-z span{left:45px;top:-4px;color:#3949ab;transform:rotateZ(90deg)}.axis-y{width:36px;background:#43a047;left:0;top:64px;transform:translateZ(32px) rotateY(-52deg) rotateZ(170deg)}.axis-y span{left:39px;top:-4px;color:#43a047}
    .nav{position:absolute;pointer-events:auto;border:0;background:transparent;color:#aab0b6;cursor:pointer;font:600 18px/1 system-ui;padding:2px}.nav:hover{color:var(--sb-text);background:var(--sb-accent-soft);border-radius:4px}.home{left:5px;top:3px;font-size:16px}.left-arrow{left:4px;top:68px}.right-arrow{right:4px;top:68px}.up-arrow{left:70px;top:4px}.down-arrow{left:70px;bottom:4px}.roll-left{left:28px;top:6px;font-size:15px}.roll-right{right:28px;top:6px;font-size:15px}
  `,
})
export class FloorField3dComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) lengthMm = 9000;
  @Input({ required: true }) widthMm = 6000;
  @Input({ required: true }) elevationMm = 0;
  @Input({ required: true }) layers: readonly FloorLayer3d[] = [];
  @Input() showGrid = false;
  @Input() initialNavigationMode: NavigationMode = 'trackpad';
  @Input() initialCamera: CameraState | null = null;
  @Input() initialCameraMode: CameraMode = 'orthographic';
  @Input() hiddenLayerIds: readonly number[] = [];

  @Output() readonly navigationModeChange = new EventEmitter<NavigationMode>();
  @Output() readonly cameraChange = new EventEmitter<CameraState>();
  @Output() readonly cameraModeChange = new EventEmitter<CameraMode>();

  @ViewChild('viewport', { static: true }) private readonly viewport?: ElementRef<HTMLDivElement>;

  readonly navigationMode = signal<NavigationMode>('trackpad');
  readonly cubeTransform = signal('rotateX(-20deg) rotateY(35deg)');
  readonly cubeDragging = signal(false);

  private engine?: ThreeDEngine;
  private floorObject?: THREE.Object3D;
  private grid?: THREE.GridHelper;
  private frameId?: number;
  private resizeObserver?: ResizeObserver;
  private hasInitialView = false;
  private readonly raycaster = new THREE.Raycaster();
  private trackpadOrbitActiveUntil = 0;
  private cubePointerId: number | null = null;
  private cubeLastX = 0;
  private cubeLastY = 0;
  private cubeDragDistance = 0;

  ngAfterViewInit(): void {
    const container = this.viewport?.nativeElement;
    if (!container) return;

    this.navigationMode.set(this.initialNavigationMode);
    this.engine = new ThreeDEngine({ container, antialias: true, cameraMode: this.initialCameraMode });
    this.engine.renderer.setClearColor(0x000000, 0);
    Object.assign(this.engine.controls, {
      minDistance: 0.5,
      maxDistance: 200,
      enableDamping: true,
      dampingFactor: 0.09,
      rotateSpeed: 0.75,
      panSpeed: 0.9,
      zoomSpeed: 1.15,
      screenSpacePanning: true,
      zoomToCursor: true,
    });

    this.grid = new THREE.GridHelper(30, 30, 0x64748b, 0x94a3b8);
    this.grid.position.y = -0.002;
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.28;
    this.grid.visible = this.showGrid;
    this.engine.scene.add(this.grid);

    this.resizeObserver = new ResizeObserver(() => this.engine?.resize());
    this.resizeObserver.observe(container);

    const canvas = this.engine.renderer.domElement;
    canvas.addEventListener('wheel', this.handleTrackpadWheel, { capture: true, passive: false });
    canvas.addEventListener('pointerdown', this.handleMousePointerDown, { capture: true });
    canvas.addEventListener('contextmenu', this.preventContextMenu);
    this.engine.controls.addEventListener('change', this.handleControlsChange);

    this.applyNavigationMode();
    this.rebuildScene();
    this.updateCubeOrientation();
    this.animate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.grid && changes['showGrid']) this.grid.visible = this.showGrid;

    if (this.engine && changes['initialCameraMode'] && !changes['initialCameraMode'].firstChange) {
      this.engine.setCameraMode(this.initialCameraMode);
      this.updateCubeOrientation();
      this.emitCamera();
    }

    if (this.engine && (changes['lengthMm'] || changes['widthMm'] || changes['elevationMm'] || changes['layers'])) {
      this.rebuildScene();
    } else if (this.floorObject && changes['hiddenLayerIds']) {
      this.applyLayerVisibility();
    }

    if (this.engine && changes['initialNavigationMode']) {
      this.navigationMode.set(this.initialNavigationMode);
      this.applyNavigationMode();
    }
  }

  ngOnDestroy(): void {
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
    if (this.engine) {
      const canvas = this.engine.renderer.domElement;
      canvas.removeEventListener('wheel', this.handleTrackpadWheel, true);
      canvas.removeEventListener('pointerdown', this.handleMousePointerDown, true);
      canvas.removeEventListener('contextmenu', this.preventContextMenu);
      this.engine.controls.removeEventListener('change', this.handleControlsChange);
    }
    this.disposeFloorObject();
    this.engine?.dispose();
  }

  setNavigationMode(mode: NavigationMode): void {
    this.navigationMode.set(mode);
    this.applyNavigationMode();
    this.navigationModeChange.emit(mode);
  }

  setCameraMode(mode: CameraMode): void {
    if (!this.engine || this.engine.cameraMode === mode) return;
    this.engine.setCameraMode(mode);
    this.updateCubeOrientation();
    this.emitCamera();
    this.cameraModeChange.emit(mode);
  }

  fitView(): void {
    this.fitDirection(new THREE.Vector3(1, 0.72, 1), new THREE.Vector3(0, 1, 0));
  }

  resetView(): void {
    this.setStandardView('top');
  }

  selectView(view: StandardView, event: MouseEvent): void {
    if (this.consumeDragClick(event)) return;
    this.setStandardView(view);
  }

  selectDirection(x: number, y: number, z: number, event: MouseEvent): void {
    if (this.consumeDragClick(event)) return;
    const direction = new THREE.Vector3(x, y, z);
    this.fitDirection(direction, this.preferredUp(direction));
  }

  setStandardView(view: StandardView): void {
    const map: Record<StandardView, { direction: THREE.Vector3; up: THREE.Vector3 }> = {
      top: { direction: new THREE.Vector3(0, 1, 0.0001), up: new THREE.Vector3(0, 0, -1) },
      bottom: { direction: new THREE.Vector3(0, -1, 0.0001), up: new THREE.Vector3(0, 0, 1) },
      front: { direction: new THREE.Vector3(0, 0, 1), up: new THREE.Vector3(0, 1, 0) },
      back: { direction: new THREE.Vector3(0, 0, -1), up: new THREE.Vector3(0, 1, 0) },
      right: { direction: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) },
      left: { direction: new THREE.Vector3(-1, 0, 0), up: new THREE.Vector3(0, 1, 0) },
    };
    const preset = map[view];
    this.fitDirection(preset.direction, preset.up);
  }

  startCubeDrag(event: PointerEvent): void {
    if (!this.engine || event.button !== 0) return;
    this.cubePointerId = event.pointerId;
    this.cubeLastX = event.clientX;
    this.cubeLastY = event.clientY;
    this.cubeDragDistance = 0;
    this.cubeDragging.set(false);
  }

  moveCubeDrag(event: PointerEvent): void {
    if (!this.engine || this.cubePointerId !== event.pointerId) return;
    const dx = event.clientX - this.cubeLastX;
    const dy = event.clientY - this.cubeLastY;
    this.cubeLastX = event.clientX;
    this.cubeLastY = event.clientY;
    this.cubeDragDistance += Math.hypot(dx, dy);

    if (!this.cubeDragging() && this.cubeDragDistance > 5) {
      this.cubeDragging.set(true);
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }
    if (!this.cubeDragging() || (!dx && !dy)) return;

    this.orbitByPixels(dx, dy, 0.012);
    event.preventDefault();
  }

  endCubeDrag(event: PointerEvent): void {
    if (this.cubePointerId !== event.pointerId) return;
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
    this.cubePointerId = null;
    this.cubeDragging.set(false);
  }

  stepOrbit(yawStep: number, pitchStep: number): void {
    this.orbitByPixels(yawStep * 26, pitchStep * 26, Math.PI / 2 / 26);
  }

  rollView(direction: -1 | 1): void {
    if (!this.engine) return;
    const camera = this.engine.camera;
    const axis = this.engine.controls.target.clone().sub(camera.position).normalize();
    camera.up.applyAxisAngle(axis, direction * Math.PI / 2).normalize();
    camera.lookAt(this.engine.controls.target);
    this.engine.controls.update();
    this.updateCubeOrientation();
    this.emitCamera();
  }

  private consumeDragClick(event: MouseEvent): boolean {
    if (this.cubeDragDistance <= 5) return false;
    event.preventDefault();
    event.stopPropagation();
    return true;
  }

  private orbitByPixels(dx: number, dy: number, sensitivity: number): void {
    if (!this.engine) return;
    const camera = this.engine.camera;
    const controls = this.engine.controls;
    const offset = camera.position.clone().sub(controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    spherical.theta -= dx * sensitivity;
    spherical.phi = THREE.MathUtils.clamp(spherical.phi - dy * sensitivity, 0.03, Math.PI - 0.03);
    offset.setFromSpherical(spherical);
    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
    controls.update();
    this.updateCubeOrientation();
    this.emitCamera();
  }

  private preferredUp(direction: THREE.Vector3): THREE.Vector3 {
    const normalized = direction.clone().normalize();
    return Math.abs(normalized.y) > 0.985
      ? new THREE.Vector3(0, 0, normalized.y > 0 ? -1 : 1)
      : new THREE.Vector3(0, 1, 0);
  }

  private fitDirection(directionInput: THREE.Vector3, upInput: THREE.Vector3): void {
    if (!this.engine || !this.floorObject) return;

    this.engine.resize();
    this.floorObject.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(this.floorObject);
    if (box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const camera = this.engine.camera;
    const controls = this.engine.controls;
    const direction = directionInput.clone().normalize();
    const up = upInput.clone().normalize();
    const right = new THREE.Vector3().crossVectors(direction, up).normalize();
    const viewUp = new THREE.Vector3().crossVectors(right, direction).normalize();

    let halfWidth = 0;
    let halfHeight = 0;
    for (const x of [-size.x / 2, size.x / 2]) {
      for (const y of [-size.y / 2, size.y / 2]) {
        for (const z of [-size.z / 2, size.z / 2]) {
          const point = new THREE.Vector3(x, y, z);
          halfWidth = Math.max(halfWidth, Math.abs(point.dot(right)));
          halfHeight = Math.max(halfHeight, Math.abs(point.dot(viewUp)));
        }
      }
    }

    camera.zoom = 1;
    const aspect = Math.max(this.engine.renderer.domElement.clientWidth, 1) / Math.max(this.engine.renderer.domElement.clientHeight, 1);
    let distance: number;

    if (camera.isPerspectiveCamera) {
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(aspect, 0.001));
      distance = Math.max(4, halfWidth / Math.tan(horizontalFov / 2), halfHeight / Math.tan(verticalFov / 2)) * 1.18;
    } else {
      const requiredHeight = Math.max(halfHeight * 2, (halfWidth * 2) / Math.max(aspect, 0.001), 0.5) * 1.18;
      this.engine.setOrthographicViewHeight(requiredHeight);
      distance = requiredHeight / (2 * Math.tan(THREE.MathUtils.degToRad(45) / 2));
    }

    camera.up.copy(up);
    camera.position.copy(center).addScaledVector(direction, distance);
    camera.near = Math.max(0.01, distance / 1000);
    camera.far = Math.max(1000, distance * 100);
    camera.updateProjectionMatrix();
    controls.target.copy(center);
    camera.lookAt(center);
    controls.update();

    this.hasInitialView = true;
    this.updateCubeOrientation();
    this.emitCamera();
    this.engine.render();
  }

  private applyNavigationMode(): void {
    if (!this.engine) return;
    const controls = this.engine.controls;
    if (this.navigationMode() === 'trackpad') {
      controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
      controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;
      controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
      controls.touches.ONE = THREE.TOUCH.PAN;
      controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
    } else {
      controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
      controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;
      controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
      controls.touches.ONE = THREE.TOUCH.ROTATE;
      controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    }
  }

  private readonly handleMousePointerDown = (event: PointerEvent): void => {
    if (!this.engine || this.navigationMode() !== 'mouse' || event.pointerType !== 'mouse') return;
    if (event.button === 1) {
      this.engine.controls.mouseButtons.MIDDLE = event.shiftKey ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
    }
    if (event.button === 0 || (event.button === 1 && !event.shiftKey)) {
      this.setOrbitPivot(event.clientX, event.clientY);
    }
  };

  private readonly preventContextMenu = (event: MouseEvent): void => event.preventDefault();

  private readonly handleControlsChange = (): void => {
    this.updateCubeOrientation();
    this.emitCamera();
  };

  private readonly handleTrackpadWheel = (event: WheelEvent): void => {
    if (!this.engine || this.navigationMode() !== 'trackpad' || event.ctrlKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const now = performance.now();
    if (now > this.trackpadOrbitActiveUntil) this.setOrbitPivot(event.clientX, event.clientY);
    this.trackpadOrbitActiveUntil = now + 180;
    this.orbitByPixels(event.deltaX, event.deltaY, 0.0032);
  };

  private setOrbitPivot(clientX: number, clientY: number): void {
    if (!this.engine || !this.floorObject) return;
    const rect = this.engine.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.raycaster.setFromCamera(
      new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1),
      this.engine.camera,
    );
    const hit = this.raycaster.intersectObject(this.floorObject, true)[0];
    if (hit) this.engine.controls.target.copy(hit.point);
  }

  private rebuildScene(): void {
    if (!this.engine) return;
    this.disposeFloorObject();

    const model: FloorFieldModel = {
      id: 'floor-field-preview',
      entity: 'floor-field',
      geometry: { lengthMm: this.lengthMm, widthMm: this.widthMm, elevationMm: this.elevationMm },
      layers: this.layers.map((layer, index) => ({
        id: String(layer.id),
        name: layer.name,
        type: layer.kind,
        thicknessMm: layer.thicknessMm,
        color: layer.color ?? this.layerColor(layer.kind, index),
      })),
    };

    this.floorObject = floorFieldToObject3D(model);
    this.floorObject.position.y = this.elevationMm * 0.001;
    this.applyLayerVisibility();
    this.engine.root.add(this.floorObject);

    if (!this.hasInitialView) {
      if (this.initialCamera) this.restore(this.initialCamera);
      else this.resetView();
      this.hasInitialView = true;
    }
  }

  private applyLayerVisibility(): void {
    if (!this.floorObject) return;
    const hidden = new Set(this.hiddenLayerIds.map(String));
    this.floorObject.traverse((object) => {
      const id = object.userData['smartBarnLayerId'];
      if (typeof id === 'string') object.visible = !hidden.has(id);
    });
  }

  private restore(state: CameraState): void {
    if (!this.engine) return;
    const camera = this.engine.camera;
    camera.position.fromArray(state.position);
    this.engine.controls.target.fromArray(state.target);

    if (camera.isOrthographicCamera) {
      const distance = Math.max(camera.position.distanceTo(this.engine.controls.target), 0.001);
      const virtualHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(45) / 2);
      this.engine.setOrthographicViewHeight(virtualHeight);
    }

    camera.zoom = state.zoom;
    camera.updateProjectionMatrix();
    camera.lookAt(this.engine.controls.target);
    this.engine.controls.update();
    this.updateCubeOrientation();
  }

  private updateCubeOrientation(): void {
    if (!this.engine) return;
    const inverse = this.engine.camera.quaternion.clone().invert();
    const euler = new THREE.Euler().setFromQuaternion(inverse, 'XYZ');
    this.cubeTransform.set(
      `rotateX(${THREE.MathUtils.radToDeg(euler.x)}deg) rotateY(${THREE.MathUtils.radToDeg(euler.y)}deg) rotateZ(${THREE.MathUtils.radToDeg(euler.z)}deg)`,
    );
  }

  private emitCamera(): void {
    if (!this.engine) return;
    this.cameraChange.emit({
      position: this.engine.camera.position.toArray() as [number, number, number],
      target: this.engine.controls.target.toArray() as [number, number, number],
      zoom: this.engine.camera.zoom,
    });
  }

  private animate = (): void => {
    this.engine?.render();
    this.frameId = requestAnimationFrame(this.animate);
  };

  private disposeFloorObject(): void {
    if (!this.floorObject || !this.engine) return;
    this.engine.root.remove(this.floorObject);
    this.floorObject.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    });
    this.floorObject = undefined;
  }

  private layerColor(kind: string, index: number): string {
    const colors: Record<string, string> = {
      sip: '#d9b36c', finish: '#c58d5b', screed: '#a8a29e', insulation: '#eab308',
      structure: '#64748b', ceiling: '#e2e8f0', custom: '#38bdf8',
    };
    return colors[kind] ?? ['#38bdf8', '#a78bfa', '#34d399'][index % 3];
  }
}
