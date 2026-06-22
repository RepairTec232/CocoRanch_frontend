import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router'; 
import { ReparacionesService } from '../services/reparaciones.service';
import { CommonModule, DatePipe } from '@angular/common';
// 👇 IMPORTANTE: Importamos FormsModule para usar [(ngModel)] en la barra de búsqueda
import { FormsModule } from '@angular/forms'; 

@Component({
  selector: 'app-tablero',
  standalone: true, 
  templateUrl: './tablero.component.html',
  styleUrls: [],
  imports: [CommonModule, DatePipe, RouterModule, FormsModule] // 👈 Añadido FormsModule aquí
})
export class TableroComponent implements OnInit {
  
  private reparacionesService = inject(ReparacionesService);
  private router = inject(Router); 

  listaReparaciones: any[] = [];
  // 👇 NUEVO: Aquí guardaremos los resultados que coincidan con la búsqueda
  listaFiltrada: any[] = []; 
  // 👇 NUEVO: Variable para capturar lo que el usuario escribe en la lupa
  terminoBusqueda: string = ''; 

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.reparacionesService.obtenerOrdenes().subscribe({
      next: (datosBD) => {
        this.listaReparaciones = datosBD;
        this.listaFiltrada = datosBD; // Al inicio, la lista filtrada muestra todo igual que la BD
      },
      error: (err) => {
        console.error('Error conectando con Spring Boot:', err);
      }
    });
  }

  // 👇 NUEVO: FUNCIÓN DE FILTRADO MULTI-CRITERIO (Filtra en caliente sin ir al Servidor)
  filtrarTablero(): void {
    const busqueda = this.terminoBusqueda.toLowerCase().trim();

    if (!busqueda) {
      this.listaFiltrada = this.listaReparaciones; // Si está vacío el buscador, muestra todo
      return;
    }

    this.listaFiltrada = this.listaReparaciones.filter(orden => {
      // Extraemos los datos previniendo que vengan nulos (con ? y '')
      const nombre = orden.cliente?.nombreCompleto?.toLowerCase() || '';
      const telefono = orden.cliente?.telefono || '';
      const modelo = orden.equipo?.modelo?.toLowerCase() || '';
      const marca = orden.equipo?.marca?.toLowerCase() || '';

      // Retorna verdadero si el texto coincide con cualquiera de estas 4 columnas
      return nombre.includes(busqueda) || 
             telefono.includes(busqueda) || 
             modelo.includes(busqueda) ||
             marca.includes(busqueda);
    });
  }

  // --- LÓGICA DE BOTONES ---

  clickNuevaReparacion() {
    console.log('Navegando a nueva reparación...');
    this.router.navigate(['/nueva-reparacion']); 
  }

  clickRevisar(folio: string) {
    console.log('Revisando folio:', folio);
    this.router.navigate(['/revisar-equipo', folio]);
  }
}