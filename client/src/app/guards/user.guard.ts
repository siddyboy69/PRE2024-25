import { CanActivateFn, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from "../../_service/user.service";
import { MessageService } from "../../_service/message.service";

export const userGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree => {
  const userService = inject(UserService);
  const router = inject(Router);
  const messageService = inject(MessageService);

  if (!userService.isLoggedIn()) {
    messageService.addMessage('You need to log in to access the book details.');
    localStorage.setItem('redirectUrl', state.url);
    return router.createUrlTree(['/login']);
  }

  return true;
};
