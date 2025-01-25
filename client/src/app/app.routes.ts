import { Routes } from '@angular/router'
import { provideAnimations } from '@angular/platform-browser/animations'
import { LoginComponent } from './login/login.component'
import { HomepageComponent } from './homepage/homepage.component'
import { adminGuard } from './guards/admin.guard'
import { userGuard } from './guards/user.guard'
import { AddMitarbeiterComponent } from './add-mitarbeiter/add-mitarbeiter.component'
import { MitarbeiterDetailComponent } from './mitarbeiter-detail/mitarbeiter-detail.component'
import { MonthlyOverviewComponent } from './monthly-overview/monthly-overview.component'
import { VerwaltungComponent } from './verwaltung/verwaltung.component'
import { PersoenlicheDatenComponent } from './persoenliche-daten/persoenliche-daten.component'
import { FirmenComponent } from './firmen/firmen.component'
import { FirmenDetailComponent } from './firmen-detail/firmen-detail.component'
import { AddFirmaComponent } from './add-firma/add-firma.component'

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'homepage', component: HomepageComponent, canActivate: [userGuard] },
  { path: 'add-mitarbeiter', component: AddMitarbeiterComponent, canActivate: [adminGuard] },
  { path: 'mitarbeiter-detail/:id', component: MitarbeiterDetailComponent, canActivate: [adminGuard] },
  { path: 'monthly-overview', component: MonthlyOverviewComponent, canActivate: [userGuard] },
  { path: 'verwaltung', component: VerwaltungComponent, canActivate: [userGuard] },
  { path: 'verwaltung/persoenliche-daten', component: PersoenlicheDatenComponent, canActivate: [userGuard] },
  { path: 'verwaltung/firmen', component: FirmenComponent, canActivate: [userGuard] },
  { path: 'verwaltung/firmen/:id', component: FirmenDetailComponent, canActivate: [userGuard] },
  { path: 'verwaltung/add-firma', component: AddFirmaComponent, canActivate: [userGuard] }
]

export const appConfig = {
  providers: [
    provideAnimations()
  ]
}
