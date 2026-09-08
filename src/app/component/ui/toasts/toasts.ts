import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-toasts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack">
      @for (t of toast.toasts(); track t.id) {
        <button class="toast" [class]="'toast--' + t.kind" (click)="toast.dismiss(t.id)">
          <span class="dot"></span>{{ t.text }}
        </button>
      }
    </div>
  `,
  styleUrl: './toasts.scss',
})
export class Toasts {
  protected readonly toast = inject(ToastService);
}
