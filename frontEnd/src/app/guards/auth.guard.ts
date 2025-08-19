import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const AuthGuard: CanActivateFn = () => {
  const service = inject(AuthService);
  const nav = inject(Router);

  return service.fetchMe().pipe(
    map(resp => {
      const user = resp?.data;
      if (user) {
        return true;
      }
      localStorage.removeItem('access_token');
      service.forceLogout();
      return nav.createUrlTree(['/login']);
    }),
    catchError(() => {
      localStorage.removeItem('access_token');
      service.forceLogout();
      return of(nav.createUrlTree(['/login']));
    })
  );
};
