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

  estadisticas: any = {
    gananciasMes: 0,
    totalPendientes: 0,
    totalEnRevision: 0,
    totalEntregados: 0,
  };

  private router = inject(Router);

  constructor(private reparacionesService: ReparacionesService) {}

  ngOnInit(): void {
    this.cargarOrdenes();
    this.cargarEstadisticas();
  }

  cargarEstadisticas() {
    this.reparacionesService.obtenerEstadisticas().subscribe({
      next: (data) => {
        this.estadisticas = data;
      },
      error: (err) => console.error('Error al cargar estadísticas', err),
    });
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
  // 🟢 MAGIA DE WHATSAPP
  enviarWhatsApp(orden: any): void {
    if (!orden.telefonoCliente) {
      alert('Este cliente no tiene un número de teléfono registrado.');
      return;
    }

    // 1. Calculamos cuánto debe
    const costo = orden.costoEstimado || 0;
    const anticipo = orden.anticipo || 0;
    const saldo = costo - anticipo;

    // 2. Formateamos el número (Agregamos +52 de México automáticamente)
    let telefono = orden.telefonoCliente.replace(/\D/g, ''); // Quitamos espacios o guiones
    if (telefono.length === 10) {
      telefono = '52' + telefono;
    }

    // 3. Armamos el mensaje usando saltos de línea (\n) y negritas de WhatsApp (*)
    let mensaje = `Hola *${orden.nombreCliente}*, te saludamos de RepairTec 🛠️.\n\n`;
    mensaje += `Te avisamos que tu equipo *${orden.equipoDetalle}* ya está listo y reparado ✅.\n`;

    if (saldo > 0) {
      mensaje += `El saldo pendiente a pagar en sucursal es de *$${saldo.toFixed(2)}*.\n`;
    } else {
      mensaje += `Tu equipo ya está totalmente pagado.\n`;
    }

    mensaje += `\n¡Te esperamos, que tengas un excelente día!`;

    // 4. Convertimos el texto a formato de link y abrimos la pestaña
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank'); // Abre en una nueva pestaña
  }

  // ⏱️ 1. CÁLCULO DE DÍAS: Cuenta cuántos días han pasado desde que ingresó el equipo
  calcularDiasEnTaller(fechaIngreso: string | Date): number {
    if (!fechaIngreso) return 0;
    const fecha = new Date(fechaIngreso);
    const hoy = new Date();
    // Restamos las fechas y convertimos los milisegundos a días
    const diferencia = hoy.getTime() - fecha.getTime();
    return Math.floor(diferencia / (1000 * 3600 * 24));
  }

  // 🚦 2. SEMÁFORO DE TIEMPOS: Decide el color del renglón en la tabla
  obtenerColorSemaforo(orden: any): string {
    const dias = this.calcularDiasEnTaller(orden.fechaIngreso);

    // 🔴 ALERTA ROJA (Abandono): Reparado por más de 30 días y no vienen por él
    if (orden.estado === 'REPARADO' && dias >= 30) {
      return 'table-danger border-danger border-2';
    }

    // 🟡 ALERTA AMARILLA (Atraso): Recibido o En Revisión por más de 3 días
    if (
      (orden.estado === 'RECIBIDO' || orden.estado === 'EN_REVISION') &&
      dias >= 3
    ) {
      return 'table-warning';
    }

    // 🟢 (Opcional) VERDE: Ya se entregó, lo pintamos de verde bajito
    if (orden.estado === 'ENTREGADO') {
      return 'table-success opacity-75';
    }

    // Blanco/Normal si todo va en tiempo
    return '';
  }
}
