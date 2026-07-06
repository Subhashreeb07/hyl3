import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from './services/session.service';

export const adminGuard: CanActivateFn = () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  const role = sessionService.getRole();
  if (role === 'ADMIN') {
    return true;
  }

  return router.createUrlTree(['/employee/dashboard']);
};
