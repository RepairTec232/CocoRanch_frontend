import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReparacionesService } from '../services/reparaciones.service';
import { OrdenRespuesta } from '../app.interfaces';
import { Router, RouterModule } from '@angular/router';
// 👇 1. IMPORTANTE: Importamos FormsModule para dar soporte a [(ngModel)] en el buscador
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // 👇 2. Agregamos FormsModule al arreglo de imports
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: [],
})
export class DashboardComponent implements OnInit {
  ordenes: OrdenRespuesta[] = [];
  // 👇 3. NUEVO: Esta es la lista que leerá el HTML (*ngFor="let orden of ordenesFiltradas")
  ordenesFiltradas: OrdenRespuesta[] = [];
  // 👇 4. NUEVO: Aquí guardaremos la cadena de texto que el usuario escriba en la lupa
  terminoBusqueda: string = '';

  cargando: boolean = true;

  private router = inject(Router);

  constructor(private reparacionesService: ReparacionesService) {}

  ngOnInit(): void {
    this.cargarOrdenes();
  }

  abrirNuevaReparacion() {
    console.log('¡Por fin, el botón correcto del Dashboard!');
    this.router.navigate(['/nueva-reparacion']);
  }

  // 👇 5. NUEVO: Agregamos el método clickRevisar que llama tu HTML al dar clic al botón de la tabla
  clickRevisar(id: number) {
    console.log('Navegando a revisión de orden ID:', id);
    this.router.navigate(['/revisar-equipo', id]);
  }

  cargarOrdenes(): void {
    this.reparacionesService.obtenerOrdenes().subscribe({
      next: (data) => {
        this.ordenes = data;
        // 👇 6. Al cargar por primera vez, la lista filtrada es idéntica a la original
        this.ordenesFiltradas = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar las órdenes', err);
        this.cargando = false;
      },
    });
  }

  // 👇 7. NUEVO: MÉTODO DE FILTRADO EN CALIENTE (Multi-criterio)
  filtrarTablero(): void {
    const busqueda = this.terminoBusqueda.toLowerCase().trim();

    // Si el buscador está vacío, restauramos la lista completa
    if (!busqueda) {
      this.ordenesFiltradas = this.ordenes;
      return;
    }

    // Filtramos sobre las propiedades planas que devuelve tu interfaz OrdenRespuesta
    this.ordenesFiltradas = this.ordenes.filter((orden: any) => {
      const cliente = orden.nombreCliente?.toLowerCase() || '';
      const telefono = orden.telefonoCliente || '';
      const equipo = orden.equipoDetalle?.toLowerCase() || '';
      const falla = orden.fallaReportada?.toLowerCase() || '';

      // Si coincide con cualquiera de estos 4 campos, se queda en la lista
      return (
        cliente.includes(busqueda) ||
        telefono.includes(busqueda) ||
        equipo.includes(busqueda) ||
        falla.includes(busqueda)
      );
    });
  }

  eliminarOrden(id: number) {
    const confirmar = confirm(
      '¿Estás seguro de que deseas eliminar esta orden de reparación? Esta acción no se puede deshacer.',
    );

    if (confirmar) {
      this.reparacionesService.eliminarOrden(id).subscribe({
        next: () => {
          alert('Orden eliminada correctamente.');
          this.cargarOrdenes(); // 🔄 Volvemos a llamar tu método de listar para que la tabla se refresque sola
        },
        error: (err) => {
          console.error('Error al eliminar la orden:', err);
          alert(
            'No se pudo eliminar la orden. Puede que tenga un equipo asignado.',
          );
        },
      });
    }
  }
}
