import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  viewChild,
} from '@angular/core';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import type { ChartConfiguration } from 'chart.js';
import { AnyChartConfig } from './chart-presets';

// Registro selectivo: sólo lo que usan los gráficos de la app (bundle mínimo).
Chart.register(
  BarController, BarElement,
  LineController, LineElement, PointElement, Filler,
  DoughnutController, ArcElement,
  CategoryScale, LinearScale, Tooltip,
);

Chart.defaults.font.family =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
Chart.defaults.color = '#7b87a3';
Chart.defaults.font.size = 11;

/** Lienzo de Chart.js envuelto en un componente: se recrea cuando cambia la config. */
@Component({
  selector: 'app-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas [attr.aria-label]="label()" role="img"></canvas>`,
  styles: [
    `
      :host { display: block; position: relative; width: 100%; }
      canvas { width: 100% !important; }
    `,
  ],
})
export class ChartCanvas implements OnDestroy {
  readonly config = input.required<AnyChartConfig>();
  readonly label = input('Gráfico');
  readonly height = input(180);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    effect(() => {
      const config = this.config();
      const el = this.canvas().nativeElement;
      el.style.height = `${this.height()}px`;

      this.chart?.destroy();
      this.chart = new Chart(el, {
        ...config,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 520, easing: 'easeOutQuart' },
          ...config.options,
        },
      } as ChartConfiguration);
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
