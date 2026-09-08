import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ExerciseService } from '../../services/exercise.service';

interface Tab {
  path: string;
  label: string;
  icon: string; // path SVG de 24×24
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly exercises = inject(ExerciseService);

  protected readonly tabs: Tab[] = [
    { path: '/hoy',     label: 'Hoy',     icon: 'M4 19V10m5 9V5m5 14v-7m5 7V8' },
    { path: '/entreno', label: 'Entreno', icon: 'M6.5 9v6M17.5 9v6M3 10.5v3M21 10.5v3M6.5 12h11' },
    { path: '/rutinas', label: 'Rutinas', icon: 'M4 6.5h16M4 12h16M4 17.5h10' },
    { path: '/perfil',  label: 'Perfil',  icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0' },
  ];

  constructor() {
    // El catálogo se usa en las tres pantallas: se precarga una sola vez al entrar.
    void this.exercises.load();
  }
}
