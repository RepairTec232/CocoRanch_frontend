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
  ventasMercadoPago: number = 0; // <-- NUEVA VARIABLE
  ventasBBVA: number = 0;
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
    this.http
      .get<any[]>('http://localhost:8080/api/caja/pedidos-actuales')
      .subscribe({
        next: (data) => {
          // ORDENAMIENTO DE MAYOR A MENOR TICKET (#)
          this.pedidosDelDia = data.sort((a, b) => Number(b.id) - Number(a.id));
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
          this.ventasMercadoPago = data.totalTarjetaMercadoPago || 0;
          this.ventasBBVA = data.totalTarjetaBBVA || 0;
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

  // Limpia las cabeceras largas quitando el Domicilio, Alergias e Identificador [PE-ID]
  obtenerNombreLimpio(origen: string): string {
    if (!origen) return 'Pedido Externo';
    // Si contiene delimitador de domicilio o alergias, tomamos solo la primera parte
    if (origen.includes(' | ')) {
      return origen.split(' | ')[0];
    }
    // Si contiene el tag [PE-ID], se lo removemos
    if (origen.includes(' [')) {
      return origen.split(' [')[0];
    }
    return origen;
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
        totalTarjetaMercadoPago: this.ventasMercadoPago,
        totalTarjetaBBVA: this.ventasBBVA,
        totalTransferencias: this.ventasTransferencia,
        totalPropinas: this.propinas,
        totalComisiones: this.comisiones,
        gastos: this.gastosGenerales,
        detalleGastos: this.detalleGastos,
        granTotal:
          this.ventasEfectivo +
          this.ventasMercadoPago +
          this.ventasBBVA +
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
    // Configuramos el PDF con formato de miniprinter térmica (80mm de ancho x 170mm de alto)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 170],
    });

    // Helper de seguridad para evitar errores de .toFixed() cuando el valor llega null
    const formatMonto = (valor: any): string => {
      const num = Number(valor);
      return isNaN(num) ? '0.00' : num.toFixed(2);
    };

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
    doc.text(
      `Fecha: ${corte.fecha || new Date().toISOString().split('T')[0]}`,
      10,
      37,
    );

    doc.text('--------------------------------------------------', 40, 42, {
      align: 'center',
    });

    // --- DESGLOSE DE INGRESOS (Coordenadas Y corregidas) ---
    let y = 50;

    doc.text('VENTAS EFECTIVO:', 10, y);
    doc.text(`$${formatMonto(corte.totalEfectivo)}`, 70, y, { align: 'right' });
    y += 6;

    doc.text('MERCADO PAGO:', 10, y);
    doc.text(`$${formatMonto(corte.totalTarjetaMercadoPago)}`, 70, y, {
      align: 'right',
    });
    y += 6;

    doc.text('TARJETA BBVA:', 10, y);
    doc.text(`$${formatMonto(corte.totalTarjetaBBVA)}`, 70, y, {
      align: 'right',
    });
    y += 6;

    doc.text('TRANSFERENCIAS:', 10, y);
    doc.text(`$${formatMonto(corte.totalTransferencias)}`, 70, y, {
      align: 'right',
    });
    y += 6;

    doc.text('PROPINAS REGISTRADAS:', 10, y);
    doc.text(`$${formatMonto(corte.totalPropinas)}`, 70, y, { align: 'right' });
    y += 6;

    doc.text('RETIROS / GASTOS:', 10, y);
    doc.text(`-$${formatMonto(corte.gastos)}`, 70, y, { align: 'right' });
    y += 6;

    if (corte.detalleGastos) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Motivo: ${corte.detalleGastos}`, 10, y);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      y += 6;
    }

    doc.text('--------------------------------------------------', 40, y, {
      align: 'center',
    });
    y += 6;

    // --- TOTALES ---
    doc.setFont('helvetica', 'bold');
    doc.text('GRAN TOTAL DEL TURNO:', 10, y);
    doc.text(`$${formatMonto(corte.granTotal)}`, 70, y, { align: 'right' });
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.text('--------------------------------------------------', 40, y, {
      align: 'center',
    });
    y += 8;

    // --- AUDITORÍA Y FIRMA ---
    doc.text('FALTANTE / SOBRANTE:', 10, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    const dif = Number(corte.diferencia) || 0;
    const textoDiferencia =
      dif >= 0 ? `+$${dif.toFixed(2)}` : `-$${Math.abs(dif).toFixed(2)}`;
    doc.text(textoDiferencia, 70, y, { align: 'right' });

    y += 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('_______________________', 40, y, { align: 'center' });
    y += 5;
    doc.text('Firma del Cajero', 40, y, { align: 'center' });

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
      next: (data) => {
        // ORDENAMIENTO DE MAYOR A MENOR TICKET (#)
        this.articulosVendidos = data.sort(
          (a, b) => Number(b.pedidoId) - Number(a.pedidoId),
        );
      },
      error: (err) => console.error('Error al cargar artículos', err),
    });
  }
}
