import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { loadWallSettings, saveWallSettings } from './wall-settings';

@Component({selector:'smartbarn-walls-page',standalone:true,imports:[TranslocoPipe],changeDetection:ChangeDetectionStrategy.OnPush,template:`
<section class="mx-auto max-w-3xl p-6 text-[var(--sb-text)]">
  <h1 class="mb-2 text-xl font-semibold">{{'walls.title'|transloco}}</h1>
  <p class="mb-6 text-sm text-[var(--sb-text-muted)]">{{'walls.hint'|transloco}}</p>
  <div class="rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-4">
    <label class="grid max-w-sm gap-2 text-sm text-[var(--sb-text-muted)]">
      {{'walls.externalThickness'|transloco}}
      <div class="flex items-center rounded-md border border-[var(--sb-border)] bg-[var(--sb-bg)] px-3 py-2">
        <input class="min-w-0 flex-1 border-0 bg-transparent text-[var(--sb-text)] outline-none" type="number" min="50" max="1000" [value]="externalWallThicknessMm()" (input)="updateThickness($event)" />
        <span class="text-xs">{{'floorField.mm'|transloco}}</span>
      </div>
    </label>
  </div>
</section>`})
export class WallsPage{
  readonly externalWallThicknessMm=signal(loadWallSettings().externalWallThicknessMm);
  updateThickness(event:Event){const n=Number((event.target as HTMLInputElement).value);if(!Number.isFinite(n))return;const value=Math.min(1000,Math.max(50,Math.round(n)));this.externalWallThicknessMm.set(value);saveWallSettings({version:1,externalWallThicknessMm:value});}
}
