import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { CatalogoComponent } from './components/catalogo/catalogo.component';
import { GestionesComponent } from './components/gestiones/gestiones.component';
import { AdminComponent } from './components/admin/admin.component';

export const routes: Routes = [
  { path: '', redirectTo: 'catalogo', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'catalogo', component: CatalogoComponent },
  { path: 'mis-gestiones', component: GestionesComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: 'catalogo' }
];