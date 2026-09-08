import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toasts } from './component/ui/toasts/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toasts],
  template: `
    <router-outlet />
    <app-toasts />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
