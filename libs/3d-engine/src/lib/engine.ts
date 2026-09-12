import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type CameraMode = 'orthographic' | 'perspective';
type EngineCamera = THREE.PerspectiveCamera & THREE.OrthographicCamera;

export interface ThreeDEngineOptions {
  container: HTMLElement;
  antialias?: boolean;
  cameraMode?: CameraMode;
}

export class ThreeDEngine {
  readonly scene = new THREE.Scene();
  camera: EngineCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;
  readonly root = new THREE.Group();
  private orthographicHeight = 20;

  constructor(private readonly options: ThreeDEngineOptions) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: options.antialias ?? true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.options.container.appendChild(this.renderer.domElement);

    this.scene.add(this.root);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(8, 12, 10);
    this.scene.add(keyLight);

    this.camera = this.createPerspectiveCamera() as EngineCamera;
    this.camera.position.set(12, 10, 12);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.resize();
    if ((options.cameraMode ?? 'orthographic') === 'orthographic') {
      this.setCameraMode('orthographic');
    }
  }

  get cameraMode(): CameraMode {
    return this.isOrthographic(this.camera) ? 'orthographic' : 'perspective';
  }

  setCameraMode(mode: CameraMode): void {
    if (this.cameraMode === mode) return;

    // Apply and clear any pending OrbitControls damping before taking the snapshot.
    // Otherwise the old inertial delta is applied to the newly created camera and
    // makes a projection switch look like a view reset.
    this.flushControlsDamping();

    const current = this.camera;
    const target = this.controls.target.clone();
    const position = current.position.clone();
    const quaternion = current.quaternion.clone();
    const up = current.up.clone();
    const direction = position.clone().sub(target).normalize();
    const aspect = this.aspect();

    let visibleHeight: number;
    if (this.isPerspective(current)) {
      const perspective = current as THREE.PerspectiveCamera;
      const distance = Math.max(0.001, position.distanceTo(target));
      visibleHeight =
        (2 * distance * Math.tan(THREE.MathUtils.degToRad(perspective.fov) / 2)) /
        Math.max(perspective.zoom, 0.001);
    } else {
      const orthographic = current as THREE.OrthographicCamera;
      visibleHeight = this.orthographicHeight / Math.max(orthographic.zoom, 0.001);
    }

    if (mode === 'orthographic') {
      this.orthographicHeight = Math.max(visibleHeight, 0.001);
      const next = this.createOrthographicCamera(aspect);
      next.position.copy(position);
      next.quaternion.copy(quaternion);
      next.up.copy(up);
      next.zoom = 1;
      next.near = current.near;
      next.far = current.far;
      next.updateProjectionMatrix();
      this.camera = next as EngineCamera;
    } else {
      const next = this.createPerspectiveCamera(aspect);
      const distance = Math.max(
        0.001,
        visibleHeight / (2 * Math.tan(THREE.MathUtils.degToRad(next.fov) / 2)),
      );
      next.position.copy(target).addScaledVector(direction, distance);
      next.quaternion.copy(quaternion);
      next.up.copy(up);
      next.zoom = 1;
      next.near = Math.max(0.01, Math.min(current.near, distance / 1000));
      next.far = Math.max(current.far, distance * 100);
      next.updateProjectionMatrix();
      this.camera = next as EngineCamera;
    }

    this.controls.object = this.camera;
    this.controls.target.copy(target);
    this.flushControlsDamping();
    this.resize();
  }

  setOrthographicViewHeight(height: number): void {
    this.orthographicHeight = Math.max(height, 0.001);
    if (this.isOrthographic(this.camera)) this.resize();
  }

  resize(): void {
    // Resizing is also used immediately before fit/center operations. Clearing
    // residual damping here guarantees that a centered camera remains centered
    // instead of drifting on the next animation frames.
    this.flushControlsDamping();

    const { clientWidth: width, clientHeight: height } = this.options.container;
    const aspect = Math.max(width, 1) / Math.max(height, 1);

    if (this.isPerspective(this.camera)) {
      const perspective = this.camera as THREE.PerspectiveCamera;
      perspective.aspect = aspect;
      perspective.updateProjectionMatrix();
    } else {
      const orthographic = this.camera as THREE.OrthographicCamera;
      const halfHeight = this.orthographicHeight / 2;
      const halfWidth = halfHeight * aspect;
      orthographic.left = -halfWidth;
      orthographic.right = halfWidth;
      orthographic.top = halfHeight;
      orthographic.bottom = -halfHeight;
      orthographic.updateProjectionMatrix();
    }

    this.renderer.setSize(width, height, false);
  }

  render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private flushControlsDamping(): void {
    const damping = this.controls.enableDamping;
    this.controls.enableDamping = false;
    this.controls.update();
    this.controls.enableDamping = damping;
  }

  private isPerspective(camera: THREE.Camera): boolean {
    return (camera as THREE.PerspectiveCamera).isPerspectiveCamera === true;
  }

  private isOrthographic(camera: THREE.Camera): boolean {
    return (camera as THREE.OrthographicCamera).isOrthographicCamera === true;
  }

  private aspect(): number {
    const { clientWidth: width, clientHeight: height } = this.options.container;
    return Math.max(width, 1) / Math.max(height, 1);
  }

  private createPerspectiveCamera(aspect = 1): THREE.PerspectiveCamera {
    return new THREE.PerspectiveCamera(45, aspect, 0.01, 100000);
  }

  private createOrthographicCamera(aspect = 1): THREE.OrthographicCamera {
    const halfHeight = this.orthographicHeight / 2;
    const halfWidth = halfHeight * aspect;
    return new THREE.OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight, 0.01, 100000);
  }
}
