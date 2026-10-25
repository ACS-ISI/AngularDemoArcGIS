import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'map',
    loadComponent: () => import('./pages/map/map.component').then((m) => m.MapComponent),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  }
];
