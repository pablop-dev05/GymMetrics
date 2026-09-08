import { MuscleGroup } from './db';

/** Etiquetas y color de cada grupo muscular (deben coincidir con $muscle-colors). */
export const MUSCLE_META: Record<MuscleGroup, { label: string; color: string; icon: string }> = {
  pecho:          { label: 'Pecho',        color: '#ff6b6b', icon: '🫀' },
  espalda:        { label: 'Espalda',      color: '#38e2c4', icon: '🦅' },
  hombro:         { label: 'Hombro',       color: '#ffb347', icon: '🪖' },
  biceps:         { label: 'Bíceps',       color: '#7c5cff', icon: '💪' },
  triceps:        { label: 'Tríceps',      color: '#a68fff', icon: '🔱' },
  antebrazo:      { label: 'Antebrazo',    color: '#5cc8ff', icon: '🤝' },
  cuadriceps:     { label: 'Cuádriceps',   color: '#b6ff5c', icon: '🦵' },
  isquiotibiales: { label: 'Femoral',      color: '#4ade80', icon: '🦿' },
  gluteo:         { label: 'Glúteo',       color: '#f472b6', icon: '🍑' },
  gemelo:         { label: 'Gemelo',       color: '#22d3ee', icon: '🐆' },
  core:           { label: 'Core',         color: '#fbbf24', icon: '🧱' },
  cardio:         { label: 'Cardio',       color: '#fb7185', icon: '❤️‍🔥' },
  cuerpo_completo:{ label: 'Full body',    color: '#94a3b8', icon: '🔥' },
};

export const MUSCLE_GROUPS = Object.keys(MUSCLE_META) as MuscleGroup[];

export const EQUIPMENT_LABEL: Record<string, string> = {
  barra: 'Barra',
  mancuerna: 'Mancuerna',
  maquina: 'Máquina',
  polea: 'Polea',
  peso_corporal: 'Peso corporal',
  kettlebell: 'Kettlebell',
  banda: 'Banda',
  cardio: 'Cardio',
  otro: 'Otro',
};

/** 0 = lunes … 6 = domingo (coincide con routine_days.weekday). */
export const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const WEEKDAYS_LONG = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** Día de la semana en base lunes a partir de un Date. */
export function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** Fecha local en formato YYYY-MM-DD (sin desplazamiento UTC). */
export function toISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return toISODate(date);
}
