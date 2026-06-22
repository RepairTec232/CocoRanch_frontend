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
