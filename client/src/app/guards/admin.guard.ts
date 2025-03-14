// admin.guard.ts
import {
  CanActivateFn,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../_service/user.service';
import { MessageService } from '../_service/message.service';

export const adminGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree => {
  const userService = inject(UserService);
  const router = inject(Router);
  const messageService = inject(MessageService);

  // Reload user session if necessary
  if (!userService.isLoggedIn()) {
    userService.user = userService.loadUserFromLocalStorage();
  }

  // Check if the user is logged in and has admin privileges
  if (!userService.isLoggedIn() || !userService.isAdmin()) {
    messageService.addMessage('Admin privileges are required to access this page.');
    return router.createUrlTree(['/homepage']); // No replaceUrl to keep history intact
  }

  return true;
};
