import Konva from 'konva';

export interface TwoDEngineOptions {
  container: HTMLDivElement | string;
  width: number;
  height: number;
}

export class TwoDEngine {
  readonly stage: Konva.Stage;
  readonly gridLayer = new Konva.Layer();
  readonly geometryLayer = new Konva.Layer();
  readonly annotationLayer = new Konva.Layer();
  readonly interactionLayer = new Konva.Layer();

  constructor(options: TwoDEngineOptions) {
    this.stage = new Konva.Stage(options);
    this.stage.add(this.gridLayer);
    this.stage.add(this.geometryLayer);
    this.stage.add(this.annotationLayer);
    this.stage.add(this.interactionLayer);
  }

  resize(width: number, height: number): void {
    this.stage.size({ width, height });
  }

  destroy(): void {
    this.stage.destroy();
  }
}
