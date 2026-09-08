import { Pipe, PipeTransform } from '@angular/core';
import { addDays, toISODate } from '../models/ui';

/** Fechas cercanas en lenguaje natural: Hoy, Ayer, Mañana, o "lun 8 sept". */
@Pipe({ name: 'smartDate' })
export class SmartDatePipe implements PipeTransform {
  transform(iso: string | null | undefined, format: 'auto' | 'long' = 'auto'): string {
    if (!iso) return '';
    const today = toISODate();
    if (format === 'auto') {
      if (iso === today) return 'Hoy';
      if (iso === addDays(today, -1)) return 'Ayer';
      if (iso === addDays(today, 1)) return 'Mañana';
    }
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const text = date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      ...(y !== new Date().getFullYear() ? { year: 'numeric' } : {}),
    });
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
