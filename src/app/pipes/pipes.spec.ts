import { describe, expect, it } from 'vitest';
import { DurationPipe } from './duration.pipe';
import { IntensityPipe } from './intensity.pipe';
import { WeekdayPipe } from './weekday.pipe';
import { SmartDatePipe } from './smart-date.pipe';
import { addDays, INTENSITIES, INTENSITY_META, toISODate, weekdayIndex } from '../models/ui';

describe('DurationPipe', () => {
  const pipe = new DurationPipe();

  it('formatea como reloj', () => {
    expect(pipe.transform(65, 'clock')).toBe('1:05');
    expect(pipe.transform(3725, 'clock')).toBe('1:02:05');
  });

  it('formatea en corto y compacto', () => {
    expect(pipe.transform(4500)).toBe('1h 15m');
    expect(pipe.transform(4500, 'compact')).toBe('1h');
    expect(pipe.transform(0)).toBe('—');
  });
});

describe('WeekdayPipe', () => {
  const pipe = new WeekdayPipe();

  it('usa lunes como día 0', () => {
    expect(pipe.transform(0)).toBe('Lun');
    expect(pipe.transform(6, 'long')).toBe('Domingo');
    expect(pipe.transform(9)).toBe('');
  });
});

describe('SmartDatePipe', () => {
  const pipe = new SmartDatePipe();

  it('reconoce hoy y ayer', () => {
    expect(pipe.transform(toISODate())).toBe('Hoy');
    expect(pipe.transform(addDays(toISODate(), -1))).toBe('Ayer');
  });
});

describe('helpers de fecha', () => {
  it('weekdayIndex convierte domingo (0 JS) en 6', () => {
    expect(weekdayIndex(new Date('2026-09-06T10:00:00'))).toBe(6); // domingo
    expect(weekdayIndex(new Date('2026-09-07T10:00:00'))).toBe(0); // lunes
  });

  it('addDays cruza el cambio de mes', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('IntensityPipe', () => {
  const pipe = new IntensityPipe();

  it('traduce la intensidad a etiqueta, pista y color', () => {
    expect(pipe.transform('vigorosa')).toBe('Vigorosa');
    expect(pipe.transform('suave', 'hint')).toBe('Puedes conversar');
    expect(pipe.transform('maxima', 'color')).toBe('#ff6b6b');
  });

  it('devuelve un marcador cuando no hay intensidad', () => {
    expect(pipe.transform(null)).toBe('—');
  });
});

describe('escala de intensidad', () => {
  it('va de menor a mayor esfuerzo, como el enum de Postgres', () => {
    const levels = INTENSITIES.map((i) => INTENSITY_META[i].level);
    expect(levels).toEqual([1, 2, 3, 4]);
    expect(INTENSITIES).toEqual(['suave', 'moderada', 'vigorosa', 'maxima']);
  });
});
