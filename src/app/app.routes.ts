import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './components/layout/default-layout/default-layout.component';
import { LoginComponent } from './components/routes/login/login.component';
import { DashboardComponent } from './Dashboard/dashboard.component';
import { NuevaReparacionComponent } from './components/nueva-reparacion.component';
import { RevisarEquipoComponent } from './components/revisar-equipo.component';
import { AnalyticsDashboardComponent } from './Dashboard/analytics-dashboard.component';
import { ReciboImpresionComponent } from './components/routes/recibo-impresion/recibo-impresion.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: DefaultLayoutComponent,
    data: { includeNavBar: true },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      // 👇 Las rutas vitales van aquí adentro 👇
      { path: 'nueva-reparacion', component: NuevaReparacionComponent },
      { path: 'revisar-equipo/:id', component: RevisarEquipoComponent },
      { path: 'revisar-equipo/:folio', component: NuevaReparacionComponent },
      { path: 'estadisticas', component: AnalyticsDashboardComponent },
      { path: 'recibo/:id', component: ReciboImpresionComponent }
    ]
  },
  // Comodín por si hay un error en la URL
  { path: '**', redirectTo: 'dashboard' }
];