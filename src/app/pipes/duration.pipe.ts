import { Pipe, PipeTransform } from '@angular/core';

/**
 * Segundos legibles.
 *  'clock' → 12:05   ·  'short' → 1h 12m  ·  'compact' → 72m
 */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(seconds: number | null | undefined, format: 'clock' | 'short' | 'compact' = 'short'): string {
    if (seconds == null || seconds <= 0) return format === 'clock' ? '0:00' : '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);

    if (format === 'clock') {
      return h > 0
        ? `${h}:${`${m}`.padStart(2, '0')}:${`${s}`.padStart(2, '0')}`
        : `${m}:${`${s}`.padStart(2, '0')}`;
    }
    if (format === 'compact') return h > 0 ? `${h}h` : `${m}m`;
    if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
    return m > 0 ? `${m}m` : `${s}s`;
  }
}
