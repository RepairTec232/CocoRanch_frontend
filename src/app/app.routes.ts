import { Routes } from '@angular/router';
import { MapaMesasComponent } from './components/mapa-mesas/mapa-mesas.component';
import { CajaComponent } from './components/caja/caja.component';
import { ComandaComponent } from './components/comanda/comanda.component';
import { MenuAdminComponent } from './components/menu-admin/menu-admin.component';
import { CorteCajaComponent } from './components/corte-caja/corte-caja.component';
import { FacturacionComponent } from './components/facturacion/facturacion.component';

export const routes: Routes = [
  { path: '', redirectTo: '/mesas', pathMatch: 'full' },
  { path: 'mesas', component: MapaMesasComponent },
  { path: 'comanda/:ordenId', component: ComandaComponent }, 
  { path: 'admin-menu', component: MenuAdminComponent },
  { path: 'caja/:ordenId', component: CajaComponent },
  { path: 'facturacion', component: FacturacionComponent },
  { path: 'corte-caja', component: CorteCajaComponent }
];
