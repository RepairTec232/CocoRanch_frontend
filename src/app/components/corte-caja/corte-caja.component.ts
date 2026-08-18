import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { RestauranteService } from '../../services/restaurante.service';

import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-corte-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './corte-caja.component.html',
})
export class CorteCajaComponent implements OnInit {
  private apiURL = 'http://localhost:8080/api/caja'; // Ajusta tu puerto si es diferente

  // 1. Declaración del Cajero (Inputs manuales)
  fondoInicial: number = 500;
  efectivoFisico: number = 0;
  gastosGenerales: number = 0;
  detalleGastos: string = '';

  // 2. Resumen del Sistema (Datos dinámicos del Backend)
  ventasEfectivo: number = 0;
  ventasTarjeta: number = 0;
  ventasTransferencia: number = 0;
  propinas: number = 0;
  comisiones: number = 0;

  historialCortes: any[] = [];

  articulosVendidos: any[] = [];
  corteSeleccionadoId: number | null = null;

  pedidosDelDia: any[] = [];

  filtroActivo: 'HOY' | 'SEMANA' | 'MES' | 'TODOS' = 'HOY';

  gastosDelTurno: any[] = [];
  nuevoGasto = { descripcion: '', monto: null };
  auditoria: { gastosEliminados: any[]; ventasCanceladas: any[] } = {
    gastosEliminados: [],
    ventasCanceladas: [],
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private service: RestauranteService,
  ) {}

  ngOnInit(): void {
    // Al abrir la pantalla, vamos a buscar las ventas de hoy
    this.obtenerResumenDelDia();
    this.cargarHistorial();
    this.cargarPedidosDelDia();
    this.cargarGastos();
    this.cargarAuditoria();
  }

  setFiltro(filtro: 'HOY' | 'SEMANA' | 'MES' | 'TODOS'): void {
    this.filtroActivo = filtro;
  }

  get historialFiltrado(): any[] {
    if (this.filtroActivo === 'TODOS') {
      return this.historialCortes;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizamos a la medianoche para evitar desfases

    return this.historialCortes.filter((corte) => {
      // Ajustamos la fecha agregando 'T00:00:00' para evitar saltos de zona horaria al parsear
      const fechaCorte = new Date(corte.fecha + 'T00:00:00');

      if (this.filtroActivo === 'HOY') {
        return fechaCorte.getTime() === hoy.getTime();
      } else if (this.filtroActivo === 'SEMANA') {
        const haceUnaSemana = new Date(hoy);
        haceUnaSemana.setDate(hoy.getDate() - 7);
        return fechaCorte >= haceUnaSemana && fechaCorte <= hoy;
      } else if (this.filtroActivo === 'MES') {
        return (
          fechaCorte.getMonth() === hoy.getMonth() &&
          fechaCorte.getFullYear() === hoy.getFullYear()
        );
      }
      return true;
    });
  }

  cargarPedidosDelDia(): void {
    // Cambia la URL si tu endpoint de Spring Boot se llama de otra forma
    this.http
      .get<any[]>('http://localhost:8080/api/caja/pedidos-actuales')
      .subscribe({
        next: (data) => {
          this.pedidosDelDia = data;
        },
        error: (err) => {
          console.error('Error al cargar pedidos del día:', err);
        },
      });
  }

  cargarHistorial(): void {
    this.http.get<any[]>(`${this.apiURL}/historial`).subscribe({
      next: (data) => (this.historialCortes = data),
      error: (err) => console.error('Error al cargar historial', err),
    });
  }

  cargarGastos(): void {
    this.http.get<any[]>(`${this.apiURL}/gastos-actuales`).subscribe({
      next: (data) => {
        this.gastosDelTurno = data;
        this.gastosGenerales = data.reduce((sum, g) => sum + g.monto, 0); // Calcula automático
        this.detalleGastos = data.map((g) => g.descripcion).join(', ');
      },
    });
  }

  registrarGasto(): void {
    if (!this.nuevoGasto.descripcion || !this.nuevoGasto.monto) return;
    this.http.post(`${this.apiURL}/gastos`, this.nuevoGasto).subscribe(() => {
      this.nuevoGasto = { descripcion: '', monto: null };
      this.cargarGastos();
    });
  }

  eliminarGasto(id: number): void {
    if (
      confirm(
        '¿Seguro que deseas eliminar este gasto? Se enviará al registro de auditoría.',
      )
    ) {
      this.http.delete(`${this.apiURL}/gastos/${id}`).subscribe(() => {
        this.cargarGastos();
        this.cargarAuditoria();
      });
    }
  }

  cargarAuditoria(): void {
    this.http.get<any>(`${this.apiURL}/auditoria`).subscribe({
      next: (data) => (this.auditoria = data),
    });
  }

  // Llama a Spring Boot para traer la suma real de las órdenes PAGADAS
  obtenerResumenDelDia(): void {
    this.http.get<any>(`${this.apiURL}/resumen-hoy`).subscribe({
      next: (data) => {
        if (data) {
          this.ventasEfectivo = data.totalEfectivo || 0;
          this.ventasTarjeta = data.totalTarjeta || 0;
          this.ventasTransferencia = data.totalTransferencias || 0;
          this.propinas = data.totalPropinas || 0;
          this.comisiones = data.totalComisiones || 0;
        }
      },
      error: (err) => {
        console.error('Error al obtener el resumen de caja:', err);
        alert(
          'No se pudo conectar con la caja. Verifica que el servidor esté encendido.',
        );
      },
    });
  }

  // Cálculos reactivos para la interfaz
  get totalEfectivoEsperado(): number {
    return (
      this.fondoInicial +
      this.ventasEfectivo +
      this.propinas -
      this.gastosGenerales
    );
  }

  get diferencia(): number {
    return this.efectivoFisico - this.totalEfectivoEsperado;
  }

  // Envía el corte a la base de datos
  guardarCorteCajaDefinitivo(): void {
    if (
      confirm(
        '¿Estás seguro de registrar este corte de caja? La jornada actual se archivará y no podrá modificarse.',
      )
    ) {
      const payloadCierre = {
        totalEfectivo: this.ventasEfectivo,
        totalTarjeta: this.ventasTarjeta,
        totalTransferencias: this.ventasTransferencia,
        totalPropinas: this.propinas,
        totalComisiones: this.comisiones,
        gastos: this.gastosGenerales,
        detalleGastos: this.detalleGastos,
        granTotal:
          this.ventasEfectivo +
          this.ventasTarjeta +
          this.ventasTransferencia +
          this.propinas +
          this.comisiones -
          this.gastosGenerales,
        fondoInicial: this.fondoInicial,
        efectivoFisicoContado: this.efectivoFisico,
        diferencia: this.diferencia,
      };

      this.http.post(`${this.apiURL}/cierre`, payloadCierre).subscribe({
        next: (res) => {
          alert('¡Corte de caja guardado con éxito en el histórico!');
          this.efectivoFisico = 0;
          this.gastosGenerales = 0;
          this.detalleGastos = '';
          this.obtenerResumenDelDia();
          this.cargarHistorial();
          window.location.reload();
        },
        error: (err) => {
          alert(
            'Error al guardar el corte: ' + (err.error?.message || err.message),
          );
        },
      });
    }
  }

  imprimirTicket(corte: any): void {
    // Configuramos el PDF con formato de miniprinter t rnica (80mm de ancho x 150mm de alto)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 160],
    });

    // --- ENCABEZADO ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('COCORANCH', 40, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.text('TICKET DE CORTE DE CAJA', 40, 22, { align: 'center' });

    // --- DATOS DEL TURNO ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Turno ID: #${corte.id}`, 10, 32);
    // Agregamos un respaldo visual por si consultas cortes muy viejos que eran null
    doc.text(
      `Fecha: ${corte.fecha || new Date().toISOString().split('T')[0]}`,
      10,
      37,
    );

    doc.text('--------------------------------------------------', 40, 42, {
      align: 'center',
    });

    // --- DESGLOSE DE INGRESOS ---
    doc.text('VENTAS EFECTIVO:', 10, 50);
    doc.text(`$${corte.totalEfectivo.toFixed(2)}`, 70, 50, { align: 'right' });

    doc.text('VENTAS TARJETA:', 10, 56);
    doc.text(`$${corte.totalTarjeta.toFixed(2)}`, 70, 56, { align: 'right' });

    doc.text('VENTAS TRANSFERENCIA:', 10, 62);
    doc.text(`$${(corte.totalTransferencias || 0).toFixed(2)}`, 70, 62, {
      align: 'right',
    });

    doc.text('PROPINAS REGISTRADAS:', 10, 68);
    doc.text(`$${corte.totalPropinas.toFixed(2)}`, 70, 68, { align: 'right' });

    doc.text('RETIROS / GASTOS:', 10, 74);
    doc.text(`-$${(corte.gastos || 0).toFixed(2)}`, 70, 74, { align: 'right' });

    // Usamos una variable dinámica para no encimar los textos
    let currentY = 80;

    if (corte.detalleGastos) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      // Imprime el motivo dinámicamente
      doc.text(`Motivo: ${corte.detalleGastos}`, 10, currentY);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      currentY += 6; // Empuja la siguiente línea hacia abajo
    }

    doc.text(
      '--------------------------------------------------',
      40,
      currentY,
      { align: 'center' },
    );
    currentY += 6;

    // --- TOTALES ---
    doc.setFont('helvetica', 'bold');
    doc.text('GRAN TOTAL DEL TURNO:', 10, currentY);
    doc.text(`$${corte.granTotal.toFixed(2)}`, 70, currentY, {
      align: 'right',
    });

    currentY += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(
      '--------------------------------------------------',
      40,
      currentY,
      { align: 'center' },
    );

    currentY += 8;
    // --- AUDITORÍA Y FIRMA ---
    doc.text('FALTANTE / SOBRANTE:', 10, currentY);

    currentY += 6;
    doc.setFont('helvetica', 'bold');
    const textoDiferencia =
      corte.diferencia > 0
        ? `+$${corte.diferencia.toFixed(2)}`
        : `-$${Math.abs(corte.diferencia).toFixed(2)}`;
    doc.text(textoDiferencia, 70, currentY, { align: 'right' });

    currentY += 20;
    // Espacio para la firma física
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('_______________________', 40, currentY, { align: 'center' });

    currentY += 5;
    doc.text('Firma del Cajero', 40, currentY, { align: 'center' });

    // --- ABRIR Y MANDAR A IMPRIMIR AUTOMÁTICAMENTE ---
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }

  verDetalleVentas(cierreId: number): void {
    // Si ya está abierto, lo cerramos
    if (this.corteSeleccionadoId === cierreId) {
      this.corteSeleccionadoId = null;
      return;
    }

    this.corteSeleccionadoId = cierreId;
    this.service.getArticulosVendidosPorCorte(cierreId).subscribe({
      next: (data) => (this.articulosVendidos = data),
      error: (err) => console.error('Error al cargar artículos', err),
    });
  }
}
