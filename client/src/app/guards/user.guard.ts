// user.guard.ts
import {CanActivateFn, Router, UrlCreationOptions, UrlTree} from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from "../../_service/user.service";
import { MessageService } from "../../_service/message.service";

export const userGuard: CanActivateFn = (): boolean | UrlTree => {
  const userService = inject(UserService);
  const router = inject(Router);
  const messageService = inject(MessageService);

  // Reload user session if necessary
  if (!userService.isLoggedIn()) {
    userService.user = userService.loadUserFromLocalStorage();
  }

  if (!userService.isLoggedIn()) {
    messageService.addMessage('You need to log in to access this page.');
    return router.createUrlTree(['/']); // No replaceUrl to keep history intact
  }

  return true;
};
