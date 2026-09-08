import { Pipe, PipeTransform, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

const LB_PER_KG = 2.2046226218;

/** Convierte kg (unidad de almacenamiento) a la unidad elegida en el perfil. */
@Pipe({ name: 'weight', pure: false })
export class WeightPipe implements PipeTransform {
  private readonly auth = inject(AuthService);

  transform(kg: number | null | undefined, opts: { unit?: boolean; decimals?: number } = {}): string {
    if (kg == null) return '—';
    const showUnit = opts.unit ?? true;
    const isLb = this.auth.unit() === 'lb';
    const value = isLb ? kg * LB_PER_KG : kg;
    const decimals = opts.decimals ?? (value % 1 === 0 ? 0 : 1);
    const text = value.toLocaleString('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return showUnit ? `${text} ${isLb ? 'lb' : 'kg'}` : text;
  }
}
