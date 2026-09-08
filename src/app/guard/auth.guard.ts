import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Protege el área privada: espera a que se restaure la sesión antes de decidir. */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.whenReady();
  if (auth.isLoggedIn()) return true;

  return router.createUrlTree(['/entrar'], { queryParams: { volver: state.url } });
};
