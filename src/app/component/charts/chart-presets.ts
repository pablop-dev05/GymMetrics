import { ChartConfiguration } from 'chart.js';

/** Configuraciones admitidas por <app-chart>. */
export type AnyChartConfig =
  | ChartConfiguration<'bar'>
  | ChartConfiguration<'line'>
  | ChartConfiguration<'doughnut'>;
import { MuscleGroup } from '../../models/db';

/** Una porción del reparto del día: todos los grupos pesan lo mismo. */
export interface GroupShare {
  group: MuscleGroup;
  label: string;
  color: string;
  pct: number;
  sets: number;
}

const GRID = 'rgba(255,255,255,0.07)';

const TOOLTIP = {
  backgroundColor: 'rgba(10,16,32,0.92)',
  borderColor: 'rgba(255,255,255,0.16)',
  borderWidth: 1,
  padding: 10,
  cornerRadius: 12,
  displayColors: false,
  titleFont: { weight: 700 as const },
};

/** Degradado vertical de acento para las barras/áreas. */
function gradient(ctx: CanvasRenderingContext2D, height: number, from: string, to: string): CanvasGradient {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  return g;
}

/** Volumen de los últimos 7 días. */
export function weeklyVolumeChart(
  labels: string[],
  values: number[],
  todayIndex: number,
): ChartConfiguration<'bar'> {
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          data: values,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 30,
          backgroundColor: (c) => {
            const area = c.chart.chartArea;
            if (!area) return 'rgba(56,226,196,0.5)';
            const on = c.dataIndex === todayIndex;
            return gradient(
              c.chart.ctx,
              area.bottom,
              on ? 'rgba(124,92,255,0.95)' : 'rgba(56,226,196,0.85)',
              on ? 'rgba(124,92,255,0.20)' : 'rgba(56,226,196,0.12)',
            );
          },
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: { ...TOOLTIP, callbacks: { label: (i) => `${Math.round(i.parsed.y ?? 0).toLocaleString('es-ES')} kg` } },
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: {
          beginAtZero: true,
          grid: { color: GRID },
          border: { display: false },
          ticks: { maxTicksLimit: 4, callback: (v) => `${Math.round(Number(v) / 1000) || ''}${Number(v) >= 1000 ? 'k' : v}` },
        },
      },
    },
  };
}

/**
 * Reparto del día por grupo trabajado. Cada grupo ocupa la misma porción: medirlo
 * en kilos dejaba el cardio siempre a cero, porque no levanta peso.
 */
export function muscleSplitChart(shares: GroupShare[]): ChartConfiguration<'doughnut'> {
  return {
    type: 'doughnut',
    data: {
      labels: shares.map((s) => s.label),
      datasets: [
        {
          data: shares.map(() => 1), // porciones idénticas
          backgroundColor: shares.map((s) => s.color),
          borderColor: 'rgba(5,7,15,0.55)',
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          ...TOOLTIP,
          callbacks: {
            label: (i) => {
              const share = shares[i.dataIndex];
              const work = share.sets === 1 ? '1 serie' : `${share.sets} series`;
              return `${share.label}: ${share.pct}% · ${work}`;
            },
          },
        },
      },
    },
  };
}

/** Progreso de un ejercicio: 1RM estimado en el tiempo. */
export function progressChart(
  labels: string[],
  values: (number | null)[],
): ChartConfiguration<'line'> {
  return {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          data: values,
          borderColor: '#38e2c4',
          borderWidth: 2.5,
          tension: 0.38,
          pointRadius: 3,
          pointBackgroundColor: '#05070f',
          pointBorderColor: '#38e2c4',
          pointBorderWidth: 2,
          fill: true,
          backgroundColor: (c) => {
            const area = c.chart.chartArea;
            if (!area) return 'rgba(56,226,196,0.15)';
            return gradient(c.chart.ctx, area.bottom, 'rgba(56,226,196,0.38)', 'rgba(56,226,196,0)');
          },
          spanGaps: true,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: { ...TOOLTIP, callbacks: { label: (i) => `${i.parsed.y ?? 0} kg est. 1RM` } },
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 6 } },
        y: { grid: { color: GRID }, border: { display: false }, ticks: { maxTicksLimit: 4 } },
      },
    },
  };
}
