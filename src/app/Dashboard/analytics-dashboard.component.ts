import { Component, OnInit } from '@angular/core';
import { ReparacionesService } from '../services/reparaciones.service';
import { OrdenRespuesta } from '../app.interfaces';
import { CommonModule, DecimalPipe } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: [],
  imports: [CommonModule, DecimalPipe, NgApexchartsModule],
})
export class AnalyticsDashboardComponent implements OnInit {
  public chartOptions: any;
  public stats: any = {};
  public cargando = true;

  public listaFaltantes: OrdenRespuesta[] = [];

  // 🪟 Variables para el Modal Express
  mostrarModalDetalles: boolean = false;
  tituloModal: string = '';
  equiposEnModal: any[] = [];

  constructor(private reparacionesService: ReparacionesService) {}

  ngOnInit(): void {
    this.reparacionesService.obtenerEstadisticasMensuales().subscribe({
      next: (data) => {
        this.stats = data;
        this.inicializarGrafica();
        this.cargando = false;
      },
      error: (err) => console.error(err),
    });

    this.reparacionesService.obtenerFaltantesPorEntregar().subscribe({
      next: (data) => {
        this.listaFaltantes = data;
      },
      error: (err) => console.error('Error al traer faltantes:', err),
    });
  }

  inicializarGrafica() {
    this.chartOptions = {
      series: [
        this.stats.totalPendientes,
        this.stats.totalEnRevision,
        this.stats.totalEntregados,
      ],
      chart: { type: 'donut', height: 350 },
      labels: ['Pendientes (Recibidos)', 'En Revisión', 'Reparados/Entregados'],
      responsive: [
        {
          breakpoint: 480,
          options: { chart: { width: 200 }, legend: { position: 'bottom' } },
        },
      ],
      colors: ['#6c757d', '#ffc107', '#28a745'], // Gris, Amarillo y Verde estilizados
    };
  }

  // ⚡ Función para abrir la ventanita mágica
  verDetalles(estado: string) {
    // 1. Ponemos el título dependiendo del botón que presionó
    this.tituloModal = estado === 'RECIBIDO' 
      ? 'Teléfonos en Fila (Esperando Revisión)' 
      : 'Equipos en Banco (Desarmados / En Revisión)';
    
    // 2. Mostramos la ventana
    this.mostrarModalDetalles = true;
    this.equiposEnModal = []; // Limpiamos la lista anterior

    // 3. Traemos los datos frescos de la base de datos y los filtramos
    this.reparacionesService.obtenerOrdenes().subscribe({
      next: (ordenes: any[]) => {
        // Guardamos solo los que coinciden con el estado del botón
        this.equiposEnModal = ordenes.filter(o => o.estado === estado);
      },
      error: (err: any) => console.error('Error al cargar detalles', err)
    });
  }

  // ❌ Función para cerrar la ventana
  cerrarModalDetalles() {
    this.mostrarModalDetalles = false;
  }

  // Función para generar el enlace de WhatsApp perfectamente limpio
  getWhatsAppLink(telefono: string): string {
    if (!telefono) return '#';

    // 1. Quitamos cualquier espacio, guion, paréntesis o letra que tenga el texto
    const numeroLimpio = telefono.replace(/\D/g, '');

    // 2. Si el número no empieza con el código de país de México (52), se lo agregamos
    const numeroConPais = numeroLimpio.startsWith('52')
      ? numeroLimpio
      : `52${numeroLimpio}`;

    // 3. Retornamos la URL oficial con un mensaje pre-escrito amigable
    const mensaje = encodeURIComponent(
      '¡Hola! Te saludamos de RepairTec. Te informamos que tu equipo ya se encuentra listo y reparado en nuestro taller. Puedes pasar por él cuando gustes. ¡Saludos!',
    );

    return `https://wa.me/${numeroConPais}?text=${mensaje}`;
  }
}
