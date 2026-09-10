import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'sb-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main class="min-h-dvh bg-[var(--sb-bg)] text-[var(--sb-text)]">
      <div class="mx-auto flex min-h-dvh w-full max-w-7xl items-center justify-center p-4 sm:p-6 lg:p-8">
        <section class="w-full max-w-md rounded-[var(--sb-radius-4)] border border-[var(--sb-border)] bg-[var(--sb-surface-raised)] p-5 shadow-[var(--sb-shadow-2)] sm:p-8">
          <router-outlet />
        </section>
      </div>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {}
