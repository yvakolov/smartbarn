import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface ThreeDEngineOptions {
  container: HTMLElement;
  antialias?: boolean;
}

export class ThreeDEngine {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000);
  readonly renderer: THREE.WebGLRenderer;
  readonly controls: OrbitControls;
  readonly root = new THREE.Group();

  constructor(private readonly options: ThreeDEngineOptions) {
    this.renderer = new THREE.WebGLRenderer({ antialias: options.antialias ?? true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.options.container.appendChild(this.renderer.domElement);

    this.scene.add(this.root);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(8, 12, 10);
    this.scene.add(keyLight);

    this.camera.position.set(12, 10, 12);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.resize();
  }

  resize(): void {
    const { clientWidth: width, clientHeight: height } = this.options.container;
    this.camera.aspect = Math.max(width, 1) / Math.max(height, 1);
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
}
