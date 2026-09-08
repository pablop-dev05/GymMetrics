import { Pipe, PipeTransform } from '@angular/core';
import { MuscleGroup } from '../models/db';
import { MUSCLE_META } from '../models/ui';

/** Nombre legible, color o icono de un grupo muscular. */
@Pipe({ name: 'muscle' })
export class MusclePipe implements PipeTransform {
  transform(group: MuscleGroup | null | undefined, field: 'label' | 'color' | 'icon' = 'label'): string {
    if (!group) return field === 'color' ? '#94a3b8' : '—';
    return MUSCLE_META[group]?.[field] ?? String(group);
  }
}
