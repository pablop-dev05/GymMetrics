import { Routes } from '@angular/router';
import { authGuard } from './guard/auth.guard';
import { guestGuard } from './guard/guest.guard';

export const routes: Routes = [
  {
    path: 'entrar',
    canActivate: [guestGuard],
    title: 'Entrar · GymMetrics',
    loadComponent: () => import('./component/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./component/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: 'hoy',
        title: 'Hoy · GymMetrics',
        loadComponent: () => import('./component/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'entreno',
        title: 'Entreno · GymMetrics',
        loadComponent: () => import('./component/workout/workout').then((m) => m.Workout),
      },
      {
        path: 'rutinas',
        title: 'Rutinas · GymMetrics',
        loadComponent: () => import('./component/routines/routines').then((m) => m.Routines),
      },
      {
        path: 'perfil',
        title: 'Perfil · GymMetrics',
        loadComponent: () => import('./component/profile/profile').then((m) => m.Profile),
      },
      { path: '', pathMatch: 'full', redirectTo: 'hoy' },
    ],
  },
  { path: '**', redirectTo: '' },
];
