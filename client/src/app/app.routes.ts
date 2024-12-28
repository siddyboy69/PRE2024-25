import { Routes } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { LoginComponent } from './login/login.component';
import { HomepageComponent } from './homepage/homepage.component';
import { adminGuard } from './guards/admin.guard';
import { userGuard } from './guards/user.guard';
import { AddMitarbeiterComponent } from './add-mitarbeiter/add-mitarbeiter.component';
import { MitarbeiterDetailComponent } from './mitarbeiter-detail/mitarbeiter-detail.component';
import { MonthlyTimesheetComponent } from './monthly-timesheet/monthly-timesheet.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'homepage', component: HomepageComponent, canActivate: [userGuard] },
  { path: 'add-mitarbeiter', component: AddMitarbeiterComponent, canActivate: [adminGuard] },
  { path: 'mitarbeiter-detail/:id', component: MitarbeiterDetailComponent, canActivate: [adminGuard] },
  { path: 'monthly-timesheet', component: MonthlyTimesheetComponent, canActivate: [userGuard] }
];

export const appConfig = {
  providers: [
    provideAnimations()
  ]
};
