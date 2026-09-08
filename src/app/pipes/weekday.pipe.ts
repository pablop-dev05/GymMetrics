import { Pipe, PipeTransform } from '@angular/core';
import { WEEKDAYS, WEEKDAYS_LONG } from '../models/ui';

/** Índice de día (0 = lunes) a nombre. */
@Pipe({ name: 'weekday' })
export class WeekdayPipe implements PipeTransform {
  transform(index: number | null | undefined, format: 'short' | 'long' = 'short'): string {
    if (index == null || index < 0 || index > 6) return '';
    return format === 'long' ? WEEKDAYS_LONG[index] : WEEKDAYS[index];
  }
}
