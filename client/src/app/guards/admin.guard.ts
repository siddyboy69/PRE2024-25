import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import{UserService} from "../../_service/user.service";

export const adminGuard: CanActivateFn = (route, state) => {
  const user = inject(UserService).isAdmin();
  if (!user) {
    inject(Router).navigate(['/']).then();
  }
  return user;
};
