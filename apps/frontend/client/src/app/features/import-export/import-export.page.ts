import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import type { FloorFieldModel } from '@smartbarn/floor-field';
import { parseFloorFieldJson, serializeFloorFieldJson } from '@smartbarn/floor-field';
import { parseSmartBarnFloorFieldIfc4, serializeFloorFieldIfc4 } from '@smartbarn/bim-converter';
import { FloorFieldStore } from '../floor-field/floor-field.store';

type TransportTab = 'import' | 'export';
type TransportFormat = 'json' | 'ifc';

@Component({
  selector: 'smartbarn-import-export-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="h-full overflow-auto bg-[var(--sb-bg)] p-6 text-[var(--sb-text)]">
      <div class="mx-auto max-w-3xl">
        <h1 class="text-xl font-semibold">Import / Export</h1>
        <p class="mt-1 text-sm text-[var(--sb-text-muted)]">Floor Field transport vertical slice: SmartBarn JSON and IFC4.</p>

        <div class="mt-6 flex gap-2 border-b border-[var(--sb-border)]">
          <button class="px-4 py-2 text-sm" [class.border-b-2]="activeTab()==='import'" (click)="activeTab.set('import')">Import</button>
          <button class="px-4 py-2 text-sm" [class.border-b-2]="activeTab()==='export'" (click)="activeTab.set('export')">Export</button>
        </div>

        @if (activeTab() === 'export') {
          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <article class="rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-5">
              <h2 class="font-medium">SmartBarn JSON</h2>
              <p class="mt-2 text-sm text-[var(--sb-text-muted)]">Native domain-model transport. Intended for lossless SmartBarn → JSON → SmartBarn restoration.</p>
              <button class="mt-4 rounded bg-[var(--sb-accent)] px-4 py-2 text-sm text-white" (click)="exportJson()">Export JSON</button>
            </article>
            <article class="rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-5">
              <h2 class="font-medium">IFC4</h2>
              <p class="mt-2 text-sm text-[var(--sb-text-muted)]">BIM transport generated from the Floor Field domain model, not from the Three.js scene.</p>
              <button class="mt-4 rounded bg-[var(--sb-accent)] px-4 py-2 text-sm text-white" (click)="exportIfc()">Export IFC4</button>
            </article>
          </div>
        } @else {
          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <label class="cursor-pointer rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-5">
              <strong class="block font-medium">Import SmartBarn JSON</strong>
              <span class="mt-2 block text-sm text-[var(--sb-text-muted)]">Validates schema and restores geometry, elevation, layer order, materials, thicknesses and identifiers.</span>
              <input class="mt-4 block w-full text-sm" type="file" accept="application/json,.json" (change)="importFile($event,'json')" />
            </label>
            <label class="cursor-pointer rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-5">
              <strong class="block font-medium">Import SmartBarn IFC4</strong>
              <span class="mt-2 block text-sm text-[var(--sb-text-muted)]">First-stage importer accepts IFC4 files exported by SmartBarn. External IFC mapping remains intentionally out of scope.</span>
              <input class="mt-4 block w-full text-sm" type="file" accept=".ifc,text/plain" (change)="importFile($event,'ifc')" />
            </label>
          </div>
        }

        @if (status()) {
          <p class="mt-5 rounded border border-[var(--sb-border)] bg-[var(--sb-surface)] p-3 text-sm">{{ status() }}</p>
        }
      </div>
    </section>
  `,
})
export class ImportExportPage {
  private readonly store = inject(FloorFieldStore);
  readonly activeTab = signal<TransportTab>('export');
  readonly status = signal('');

  constructor() {
    this.store.initialize();
  }

  exportJson(): void {
    this.download('smartbarn-floor-field.json', serializeFloorFieldJson(this.currentModel()), 'application/json');
    this.status.set('JSON exported from the current Floor Field domain snapshot.');
  }

  exportIfc(): void {
    this.download('smartbarn-floor-field.ifc', serializeFloorFieldIfc4(this.currentModel()), 'application/x-step');
    this.status.set('IFC4 exported. Open it in an IFC viewer to validate geometry and layers.');
  }

  async importFile(event: Event, format: TransportFormat): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const model = format === 'json' ? parseFloorFieldJson(text) : parseSmartBarnFloorFieldIfc4(text);
      this.persistForEditor(model);
      this.status.set('Import validated. Reloading the Floor Field Editor with the restored model…');
      window.location.assign(new URL('app/floor-field', document.baseURI).toString());
    } catch (error) {
      this.status.set(error instanceof Error ? error.message : 'Import failed.');
      input.value = '';
    }
  }

  private currentModel(): FloorFieldModel {
    return {
      id: 'floor-field-1',
      version: 1,
      entity: 'floor-field',
      geometry: { lengthMm: this.store.lengthMm(), widthMm: this.store.widthMm(), elevationMm: this.store.elevationMm() },
      referencePlane: { id: 'datum-top-structural', elevationMm: this.store.elevationMm() },
      layersAbove: [],
      layersBelow: this.store.layers().map((layer) => ({
        id: String(layer.id),
        name: layer.name,
        type: layer.kind,
        thicknessMm: layer.thicknessMm,
        color: layer.color,
      })),
    };
  }

  private persistForEditor(model: FloorFieldModel): void {
    const layers = [...model.layersAbove, ...model.layersBelow].map((layer, index) => ({
      id: Number.isSafeInteger(Number(layer.id)) && Number(layer.id) > 0 ? Number(layer.id) : index + 1,
      kind: layer.type,
      name: layer.name,
      thicknessMm: layer.thicknessMm,
      color: layer.color ?? '#8ab4f8',
    }));
    if (!layers.length) throw new Error('Imported Floor Field contains no layers.');
    window.localStorage.setItem('smartbarn.floor-field.v1', JSON.stringify({
      version: 1,
      lengthMm: model.geometry.lengthMm,
      widthMm: model.geometry.widthMm,
      elevationMm: model.geometry.elevationMm ?? model.referencePlane.elevationMm,
      layers,
    }));
  }

  private download(filename: string, content: string, type: string): void {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
