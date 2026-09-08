import { Pipe, PipeTransform } from '@angular/core';
import { CardioIntensity } from '../models/db';
import { INTENSITY_META } from '../models/ui';

/** Nombre, pista o color de una intensidad de cardio. */
@Pipe({ name: 'intensity' })
export class IntensityPipe implements PipeTransform {
  transform(
    value: CardioIntensity | null | undefined,
    field: 'label' | 'hint' | 'color' = 'label',
  ): string {
    if (!value) return field === 'color' ? '#7b87a3' : '—';
    return String(INTENSITY_META[value]?.[field] ?? value);
  }
}
