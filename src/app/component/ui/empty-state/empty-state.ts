import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <div class="orb">{{ icon() }}</div>
      <h3>{{ title() }}</h3>
      <p class="muted">{{ text() }}</p>
      <ng-content />
    </div>
  `,
  styles: [
    `
      .wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--sp-3);
        padding: var(--sp-8) var(--sp-5);
        text-align: center;
      }

      .orb {
        width: 82px;
        height: 82px;
        display: grid;
        place-items: center;
        font-size: 34px;
        border-radius: 50%;
        background: radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.04));
        border: 1px solid var(--glass-border);
        backdrop-filter: blur(14px);
        box-shadow: 0 12px 34px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }

      p { font-size: 14px; max-width: 34ch; }
    `,
  ],
})
export class EmptyState {
  readonly icon = input('✨');
  readonly title = input.required<string>();
  readonly text = input('');
}
