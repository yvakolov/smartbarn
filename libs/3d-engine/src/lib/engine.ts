import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type CameraMode = 'orthographic' | 'perspective';

export interface ThreeDEngineOptions {
  container: HTMLElement;
  antialias?: boolean;
  cameraMode?: CameraMode;
}

export class ThreeDEngine {
  readonly scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
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

    this.camera = this.createPerspectiveCamera();
    this.camera.position.set(12, 10, 12);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.resize();
    if ((options.cameraMode ?? 'orthographic') === 'orthographic') {
      this.setCameraMode('orthographic');
    }
  }

  get cameraMode(): CameraMode {
    return this.camera.isOrthographicCamera ? 'orthographic' : 'perspective';
  }

  setCameraMode(mode: CameraMode): void {
    if (this.cameraMode === mode) return;

    const target = this.controls.target.clone();
    const direction = this.camera.position.clone().sub(target).normalize();
    const up = this.camera.up.clone();
    const aspect = this.aspect();

    if (mode === 'orthographic') {
      const perspective = this.camera as THREE.PerspectiveCamera;
      const distance = Math.max(0.001, perspective.position.distanceTo(target));
      const visibleHeight =
        (2 * distance * Math.tan(THREE.MathUtils.degToRad(perspective.fov) / 2)) /
        Math.max(perspective.zoom, 0.001);
      this.orthographicHeight = Math.max(visibleHeight, 0.001);
      const next = this.createOrthographicCamera(aspect);
      next.position.copy(perspective.position);
      next.up.copy(up);
      next.lookAt(target);
      next.updateProjectionMatrix();
      this.camera = next;
    } else {
      const orthographic = this.camera as THREE.OrthographicCamera;
      const visibleHeight = this.orthographicHeight / Math.max(orthographic.zoom, 0.001);
      const next = this.createPerspectiveCamera(aspect);
      const distance = visibleHeight / (2 * Math.tan(THREE.MathUtils.degToRad(next.fov) / 2));
      next.position.copy(target).addScaledVector(direction, distance);
      next.up.copy(up);
      next.lookAt(target);
      next.updateProjectionMatrix();
      this.camera = next;
    }

    this.controls.object = this.camera;
    this.controls.target.copy(target);
    this.controls.update();
    this.resize();
  }

  setOrthographicViewHeight(height: number): void {
    this.orthographicHeight = Math.max(height, 0.001);
    if (this.camera.isOrthographicCamera) this.resize();
  }

  resize(): void {
    const { clientWidth: width, clientHeight: height } = this.options.container;
    const aspect = Math.max(width, 1) / Math.max(height, 1);

    if (this.camera.isPerspectiveCamera) {
      this.camera.aspect = aspect;
    } else {
      const halfHeight = this.orthographicHeight / 2;
      const halfWidth = halfHeight * aspect;
      this.camera.left = -halfWidth;
      this.camera.right = halfWidth;
      this.camera.top = halfHeight;
      this.camera.bottom = -halfHeight;
    }

    this.camera.updateProjectionMatrix();
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
