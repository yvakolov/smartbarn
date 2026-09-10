import { ChangeDetectionStrategy, Component, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LocaleService } from '@smartbarn/platform-i18n';
import { ThemeService } from '@smartbarn/ui-ds';

@Component({
  selector: 'sb-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnDestroy {
  private readonly locale = inject(LocaleService);
  private readonly theme = inject(ThemeService);

  constructor() {
    this.locale.initialize();
    this.theme.initialize();
  }

  ngOnDestroy(): void {
    this.theme.destroy();
  }
}
