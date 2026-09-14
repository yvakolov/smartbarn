import { ChangeDetectionStrategy, Component } from '@angular/core';

type MaterialCategory = {
  readonly name: string;
  readonly children?: readonly MaterialCategory[];
};

@Component({
  selector: 'smartbarn-materials-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="h-full overflow-auto bg-[var(--sb-bg)] p-4 text-[var(--sb-text)] md:p-6">
      <div class="mx-auto max-w-4xl">
        <h1 class="text-xl font-semibold">Справочник материалов</h1>
        <p class="mt-1 text-sm text-[var(--sb-text-muted)]">Базовая структура каталога. Карточки материалов и ссылки из конструкций добавим следующим этапом.</p>

        <div class="mt-6 rounded-lg border border-[var(--sb-border)] bg-[var(--sb-surface)] p-3">
          <div class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--sb-text-muted)]">Материалы</div>
          <div class="mt-1 space-y-1">
            @for (category of categories; track category.name) {
              <details class="group rounded-md" open>
                <summary class="cursor-pointer list-none rounded px-3 py-2 text-sm hover:bg-[var(--sb-gray-3)]">
                  <span class="mr-2 inline-block w-4 text-center text-[var(--sb-text-muted)] group-open:rotate-90">›</span>{{ category.name }}
                </summary>
                @if (category.children?.length) {
                  <div class="ml-6 border-l border-[var(--sb-border)] pl-2">
                    @for (child of category.children; track child.name) {
                      <div class="rounded px-3 py-2 text-sm text-[var(--sb-text-muted)]">{{ child.name }}</div>
                    }
                  </div>
                }
              </details>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class MaterialsPage {
  readonly categories: readonly MaterialCategory[] = [
    { name: 'Древесина' },
    { name: 'Листовые материалы', children: [{ name: 'OSB' }, { name: 'Фанера' }, { name: 'ГКЛ / ГВЛ' }] },
    { name: 'Теплоизоляция' },
    { name: 'Бетон / растворы' },
    { name: 'Металл' },
    { name: 'Мембраны / плёнки' },
    { name: 'Отделочные материалы' },
    { name: 'Крепёж' },
    { name: 'Прочее' },
  ];
}
