import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sb-root',
  standalone: true,
  template: `
    <main class="app-shell">
      <header class="app-header">
        <div>
          <strong>Smart Barn</strong>
          <span>Модуль перекрытий</span>
        </div>
      </header>

      <section class="workspace">
        <h1>Создание перекрытия</h1>
        <p>Базовый Nx + Angular 22 workspace готов. Следующий шаг — перенос Geometry / Layers / 3D на компоненты Spartan UI.</p>
      </section>
    </main>
  `,
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
