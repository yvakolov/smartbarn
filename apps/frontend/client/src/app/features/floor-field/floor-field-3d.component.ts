import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ThreeDEngine, floorFieldToObject3D } from '@smartbarn/3d-engine';
import type { FloorFieldModel } from '@smartbarn/domain';
import * as THREE from 'three';

interface FloorLayer3d {
  readonly id: number;
  readonly kind: string;
  readonly name: string;
  readonly thicknessMm: number;
}

/**
 * Thin Angular adapter around the framework-agnostic ThreeDEngine.
 *
 * The page owns editable state; this component only projects that state into a
 * disposable Three.js scene. Keeping the renderer here prevents 3D concerns
 * from leaking into the floor-field domain/UI interaction code.
 */
@Component({
  selector: 'smartbarn-floor-field-3d',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="viewport-shell">
      <div #viewport class="viewport" aria-label="Interactive 3D floor field preview"></div>
      <div class="viewport-hint">Drag to rotate · Wheel to zoom · Right-drag to pan</div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 0;
    }

    .viewport-shell {
      position: relative;
      min-height: 24rem;
      overflow: hidden;
      border-radius: var(--sb-radius-3);
      background:
        radial-gradient(circle at 50% 35%, var(--sb-accent-soft), transparent 42%),
        var(--sb-surface);
    }

    .viewport {
      width: 100%;
      height: clamp(24rem, 58vh, 44rem);
    }

    .viewport :global(canvas) {
      display: block;
    }

    .viewport-hint {
      position: absolute;
      right: 0.75rem;
      bottom: 0.75rem;
      border: 1px solid var(--sb-border);
      border-radius: var(--sb-radius-2);
      background: color-mix(in srgb, var(--sb-surface-raised) 88%, transparent);
      padding: 0.4rem 0.55rem;
      color: var(--sb-text-muted);
      font-size: 0.72rem;
      pointer-events: none;
      backdrop-filter: blur(8px);
    }
  `,
})
export class FloorField3dComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) lengthMm = 10_000;
  @Input({ required: true }) widthMm = 8_000;
  @Input({ required: true }) elevationMm = 0;
  @Input({ required: true }) layers: readonly FloorLayer3d[] = [];

  @ViewChild('viewport', { static: true }) private readonly viewport?: ElementRef<HTMLDivElement>;

  private engine?: ThreeDEngine;
  private floorObject?: THREE.Object3D;
  private frameId?: number;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    const container = this.viewport?.nativeElement;
    if (!container) return;

    this.engine = new ThreeDEngine({ container, antialias: true });
    this.engine.renderer.setClearColor(0x000000, 0);
    this.engine.camera.position.set(12, 9, 12);
    this.engine.controls.target.set(0, 0, 0);
    this.engine.controls.minDistance = 2;
    this.engine.controls.maxDistance = 80;

    const grid = new THREE.GridHelper(30, 30, 0x64748b, 0x94a3b8);
    grid.position.y = -0.002;
    grid.material.transparent = true;
    grid.material.opacity = 0.28;
    this.engine.scene.add(grid);

    this.resizeObserver = new ResizeObserver(() => this.engine?.resize());
    this.resizeObserver.observe(container);

    this.rebuildScene();
    this.animate();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.engine) this.rebuildScene();
  }

  ngOnDestroy(): void {
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
    this.disposeFloorObject();
    this.engine?.dispose();
  }

  private rebuildScene(): void {
    if (!this.engine) return;

    this.disposeFloorObject();

    const model: FloorFieldModel = {
      id: 'floor-field-preview',
      entity: 'floor-field',
      geometry: {
        lengthMm: this.lengthMm,
        widthMm: this.widthMm,
        elevationMm: this.elevationMm,
      },
      layers: this.layers.map((layer, index) => ({
        id: String(layer.id),
        name: layer.name,
        type: layer.kind,
        thicknessMm: layer.thicknessMm,
        color: this.layerColor(layer.kind, index),
      })),
    };

    this.floorObject = floorFieldToObject3D(model);
    this.floorObject.position.y = this.elevationMm * 0.001;
    this.engine.root.add(this.floorObject);

    const size = Math.max(this.lengthMm, this.widthMm) * 0.001;
    const distance = Math.max(7, size * 1.35);
    this.engine.camera.position.set(distance, distance * 0.72, distance);
    this.engine.controls.target.set(0, -this.totalThicknessMeters() / 2, 0);
    this.engine.controls.update();
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

  private totalThicknessMeters(): number {
    return this.layers.reduce((sum, layer) => sum + layer.thicknessMm, 0) * 0.001;
  }

  private layerColor(kind: string, index: number): string {
    const colors: Record<string, string> = {
      finish: '#c58d5b',
      screed: '#a8a29e',
      insulation: '#eab308',
      structure: '#64748b',
      ceiling: '#e2e8f0',
      custom: '#38bdf8',
    };
    return colors[kind] ?? ['#38bdf8', '#a78bfa', '#34d399'][index % 3];
  }
}
