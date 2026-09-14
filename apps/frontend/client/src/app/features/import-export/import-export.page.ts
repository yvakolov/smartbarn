import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
    <section class="h-full overflow-auto bg-[var(--sb-bg)] p-4 text-[var(--sb-text)] md:p-6">
      <div class="mx-auto max-w-3xl">
        <h1 class="text-xl font-semibold">{{ activeTab() === 'import' ? 'Импорт' : 'Экспорт' }}</h1>
        <p class="mt-1 text-sm text-[var(--sb-text-muted)]">SmartBarn JSON и IFC4 для текущего перекрытия.</p>

        @if (activeTab() === 'export') {
          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <article class="rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-5">
              <h2 class="font-medium">SmartBarn JSON</h2>
              <p class="mt-2 text-sm text-[var(--sb-text-muted)]">Нативный формат доменной модели для восстановления без потерь.</p>
              <button class="mt-4 rounded bg-[var(--sb-accent)] px-4 py-2 text-sm text-white" (click)="exportJson()">Экспорт JSON</button>
            </article>
            <article class="rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-5">
              <h2 class="font-medium">IFC4</h2>
              <p class="mt-2 text-sm text-[var(--sb-text-muted)]">Один IfcSlab с IfcMaterialLayerSet из текущего состояния SmartBarn.</p>
              <button class="mt-4 rounded bg-[var(--sb-accent)] px-4 py-2 text-sm text-white" (click)="exportIfc()">Экспорт IFC4</button>
            </article>
          </div>
        } @else {
          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <label class="cursor-pointer rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-5">
              <strong class="block font-medium">SmartBarn JSON</strong>
              <span class="mt-2 block text-sm text-[var(--sb-text-muted)]">Проверяет файл и восстанавливает геометрию, слои и параметры перекрытия.</span>
              <input class="mt-4 block w-full text-sm" type="file" accept="application/json,.json" (change)="importFile($event,'json')" />
            </label>
            <label class="cursor-pointer rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-5">
              <strong class="block font-medium">SmartBarn IFC4</strong>
              <span class="mt-2 block text-sm text-[var(--sb-text-muted)]">Показывает структуру IfcSlab и его слоёв перед восстановлением.</span>
              <input class="mt-4 block w-full text-sm" type="file" (change)="importFile($event,'ifc')" />
            </label>
          </div>
        }

        @if (inspection(); as model) {
          <article class="mt-5 rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-5">
            <div class="flex items-start justify-between gap-3">
              <div><h2 class="font-semibold">IFC Inspector</h2><p class="mt-1 text-xs text-[var(--sb-text-muted)]">Прочитано из выбранного IFC</p></div>
              <span class="rounded border border-[var(--sb-border)] px-2 py-1 text-xs">IfcSlab</span>
            </div>
            <div class="mt-4 rounded border border-[var(--sb-border)] p-4">
              <div class="flex justify-between gap-3"><strong>Цокольное перекрытие</strong><span>{{ totalThickness(model) }} mm</span></div>
              <div class="mt-1 text-xs text-[var(--sb-text-muted)]">{{ model.geometry.lengthMm }} × {{ model.geometry.widthMm }} mm · IfcMaterialLayerSet</div>
              <div class="mt-4 space-y-2">
                @for (layer of allLayers(model); track layer.id; let i = $index) {
                  <div class="flex items-center justify-between gap-3 border-l-2 border-[var(--sb-border)] pl-3">
                    <div class="min-w-0"><div class="truncate text-sm">{{ i + 1 }}. {{ layer.name }}</div><div class="text-xs text-[var(--sb-text-muted)]">{{ layer.type }}</div></div>
                    <strong class="shrink-0 text-sm">{{ layer.thicknessMm }} mm</strong>
                  </div>
                }
              </div>
            </div>
            <button class="mt-4 w-full rounded bg-[var(--sb-accent)] px-4 py-2 text-sm text-white" (click)="restoreInspectedIfc()">Восстановить в перекрытии</button>
          </article>
        }

        @if (status()) {<p class="mt-5 rounded border border-[var(--sb-border)] bg-[var(--sb-surface)] p-3 text-sm">{{ status() }}</p>}
      </div>
    </section>
  `,
})
export class ImportExportPage {
  private readonly store = inject(FloorFieldStore);
  private readonly route = inject(ActivatedRoute);
  readonly activeTab = signal<TransportTab>((this.route.snapshot.data['transportTab'] as TransportTab | undefined) ?? 'export');
  readonly status = signal('');
  readonly inspection = signal<FloorFieldModel | null>(null);

  constructor() { this.store.initialize(); }

  exportJson(): void { this.download('smartbarn-floor-field.json', serializeFloorFieldJson(this.currentModel()), 'application/json'); this.status.set('JSON экспортирован.'); }
  exportIfc(): void { this.download('smartbarn-floor-field.ifc', serializeFloorFieldIfc4(this.currentModel()), 'application/x-step'); this.status.set('IFC4 экспортирован.'); }

  async importFile(event: Event, format: TransportFormat): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (format === 'ifc' && !file.name.toLowerCase().endsWith('.ifc')) throw new Error('Выберите файл .ifc.');
      const text = await file.text();
      const model = format === 'json' ? parseFloorFieldJson(text) : parseSmartBarnFloorFieldIfc4(text);
      if (format === 'ifc') {
        this.inspection.set(model);
        this.status.set('IFC проверен. Слои показаны ниже.');
        return;
      }
      this.persistForEditor(model);
      this.openEditor();
    } catch (error) {
      this.inspection.set(null);
      this.status.set(error instanceof Error ? error.message : 'Ошибка импорта.');
      input.value = '';
    }
  }

  restoreInspectedIfc(): void { const model = this.inspection(); if (!model) return; this.persistForEditor(model); this.openEditor(); }
  allLayers(model: FloorFieldModel) { return [...model.layersAbove, ...model.layersBelow]; }
  totalThickness(model: FloorFieldModel): number { return this.allLayers(model).reduce((sum, layer) => sum + layer.thicknessMm, 0); }

  private openEditor(): void { this.status.set('Импорт проверен. Открываю перекрытие…'); window.location.assign(new URL('app/floor-field', document.baseURI).toString()); }
  private currentModel(): FloorFieldModel { return { id: 'floor-field-1', version: 1, entity: 'floor-field', geometry: { lengthMm: this.store.lengthMm(), widthMm: this.store.widthMm(), elevationMm: this.store.elevationMm() }, referencePlane: { id: 'datum-top-structural', elevationMm: this.store.elevationMm() }, layersAbove: [], layersBelow: this.store.layers().map((layer) => ({ id: String(layer.id), name: layer.name, type: layer.kind, thicknessMm: layer.thicknessMm, color: layer.color })) }; }
  private persistForEditor(model: FloorFieldModel): void { const layers = this.allLayers(model).map((layer, index) => ({ id: Number.isSafeInteger(Number(layer.id)) && Number(layer.id) > 0 ? Number(layer.id) : index + 1, kind: layer.type, name: layer.name, thicknessMm: layer.thicknessMm, color: layer.color ?? '#8ab4f8' })); if (!layers.length) throw new Error('В импортируемом перекрытии нет слоёв.'); localStorage.setItem('smartbarn.floor-field.v1', JSON.stringify({ version: 1, lengthMm: model.geometry.lengthMm, widthMm: model.geometry.widthMm, elevationMm: model.geometry.elevationMm ?? model.referencePlane.elevationMm, layers })); }
  private download(filename: string, content: string, type: string): void { const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); }
}
