import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { RestauranteService } from '../../services/restaurante.service';
import { Orden, Producto } from '../../models/restaurante.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-comanda',
  standalone: true, // Aseguramos que compile bien como Standalone
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './comanda.component.html',
  styleUrls: [],
})
export class ComandaComponent implements OnInit {
  ordenId!: number;
  ordenActiva: Orden | null = null;
  menuProductos: Producto[] = [];

  mesasLibres: any[] = []; // Para llenar el selector de cambio
  mostrarModalMesa: boolean = false;
  idMesaSeleccionada: string | number = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: RestauranteService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    // 1. Obtenemos el ID de la URL (ej. /comanda/45)
    this.ordenId = Number(this.route.snapshot.paramMap.get('ordenId'));

    // 2. Cargamos los datos
    this.cargarOrden();
    this.cargarMenu();
  }

cargarOrden(): void {
    this.service.getOrdenById(this.ordenId).subscribe({
      next: (data) => {
        this.ordenActiva = data;
        
        // Recalcular subtotal en el cliente si viene en cero pero con productos
        if (this.ordenActiva && this.ordenActiva.detalles) {
          let suma = 0;
          this.ordenActiva.detalles.forEach(det => {
            suma += (det.precioUnitario * det.cantidad);
          });
          if (suma > 0) {
            this.ordenActiva.subtotal = suma;
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar la orden:', err);
        alert('No se pudo cargar la comanda. Regresando al mapa...');
        this.router.navigate(['/mesas']);
      },
    });
  }
  cargarMenu(): void {
    this.service.getProductos().subscribe((data) => {
      this.menuProductos = data;
    });
  }

  agregarAlTicket(producto: Producto): void {
    if (!producto.id) {
      console.error('El producto seleccionado no tiene un ID válido');
      return;
    }

    this.service.agregarProducto(this.ordenId, producto.id, 1, '').subscribe({
      next: (ordenActualizada) => {
        this.ordenActiva = ordenActualizada;
        console.log('Producto agregado con éxito');
      },
      error: (err) => {
        console.error('Error al agregar producto', err);
      },
    });
  }

  quitarDelTicket(detalleId: number | undefined): void {
    if (detalleId && confirm('¿Quitar este platillo de la orden?')) {
      this.service.eliminarDetalle(this.ordenId, detalleId).subscribe(() => {
        this.cargarOrden();
      });
    }
  }

  guardarNota(detalle: any): void {
    if (detalle.notas !== undefined) {
      this.service
        .actualizarNota(this.ordenId, detalle.id, detalle.notas)
        .subscribe(() => console.log('Nota guardada con éxito'));
    }
  }

  enviarACocina(): void {
    // Validamos que la orden tenga al menos un producto antes de mandarla
    if (!this.ordenActiva?.detalles || this.ordenActiva.detalles.length === 0) {
      alert(
        '⚠️ Agrega al menos un platillo al ticket antes de enviar a cocina.',
      );
      return;
    }

    if (confirm('¿Enviar pedido a la cocina?')) {
      // Usamos el endpoint que acabamos de crear en Java
      this.http
        .put(
          `http://localhost:8080/api/ordenes/${this.ordenId}/enviar-cocina`,
          {},
        )
        .subscribe({
          next: () => {
            alert('🧑‍🍳 ¡Comanda enviada a cocina con éxito!');

            // 👇 QUITAMOS EL ROUTER.NAVIGATE Y PONEMOS ESTO 👇
            // Llama a tu función que carga la orden.
            // (Revisa si en tu archivo se llama cargarOrden(), obtenerOrden() o cargarOrdenActiva())
            this.cargarOrden();
          },
          error: (err) => {
            console.error('Error al enviar a cocina:', err);
            alert('Hubo un error al procesar el pedido.');
          },
        });
    }
  }
  // CORRECCIÓN: Agregamos el signo "?" para evitar el error si ordenActiva es null
  irACobrar(): void {
    if (!this.ordenActiva || this.ordenActiva.detalles?.length === 0) {
      alert('La cuenta está en ceros. Agrega productos antes de cobrar.');
      return;
    }

    this.router.navigate(['/caja', this.ordenId]);
  }

  cancelarYLiberarMesa(): void {
    const tieneProductos =
      this.ordenActiva?.detalles && this.ordenActiva.detalles.length > 0;

    // Si tiene productos, advertimos con más fuerza por seguridad. Si está vacía, el mensaje es directo.
    const mensaje = tieneProductos
      ? '⚠️ ATENCIÓN: Esta mesa ya tiene platillos registrados. ¿Estás seguro de que deseas CANCELAR la orden por completo y liberar la mesa?'
      : '¿Deseas cancelar esta orden vacía y liberar la mesa?';

    if (confirm(mensaje)) {
      // Usamos el endpoint de cancelar que creamos (o crearemos) en tu Backend
      this.service.cancelarOrden(this.ordenId).subscribe({
        next: () => {
          alert('Mesa liberada correctamente y orden cancelada.');
          this.router.navigate(['/mesas']); // Regresamos al mapa
        },
        error: (err) => {
          console.error('Error al liberar la mesa:', err);
          alert('No se pudo liberar la mesa: ' + err.message);
        },
      });
    }
  }
  regresarAMesas(): void {
    this.router.navigate(['/mesas']);
  }

  cargarMesasParaTraspaso(): void {
    this.service.getMesas().subscribe({
      next: (data) => {
        console.log('Mesas recibidas del servidor:', data); // Para auditar en la consola si es necesario
        // Filtramos asegurando que detecte 'libre', 'LIBRE', 'free', etc.
        this.mesasLibres = data.filter((m: any) => {
          const estado = m.estado ? String(m.estado).toUpperCase() : '';
          return (
            estado === 'LIBRE' || estado === 'FREE' || estado === 'DISPONIBLE'
          );
        });
      },
      error: (err) => console.error('Error al traer mesas:', err),
    });
  }

  // 2. Inyectamos la referencia del elemento HTML
  @ViewChild('miModalTraspaso') modalElement!: ElementRef<HTMLDialogElement>;

  // Reemplazamos la variable booleana anterior por el control del Dialog
  abrirModalCambioMesa(): void {
    this.idMesaSeleccionada = '';
    this.mesasLibres = [];
    this.cargarMesasParaTraspaso();

    // ¡LA MAGIA!: El método showModal() abre la ventana por encima de TODO de forma nativa
    this.modalElement.nativeElement.showModal();
  }

  cerrarModal(): void {
    this.modalElement.nativeElement.close();
  }

  // Modificamos el éxito del traspaso para que use la nueva función de cerrar
  confirmarCambioMesa(): void {
    if (!this.idMesaSeleccionada || this.idMesaSeleccionada === '') {
      alert('Por favor, selecciona una mesa de la lista.');
      return;
    }

    const nuevaMesaId = Number(this.idMesaSeleccionada);

    this.service.cambiarMesa(this.ordenId, nuevaMesaId).subscribe({
      next: (ordenActualizada) => {
        alert('🤠 ¡Pedido traspasado con éxito!');
        this.cerrarModal(); // <-- Cerramos nativamente
        this.router.navigate(['/mesas']);
      },
      error: (err) => {
        alert(err.error?.message || 'No se pudo realizar el cambio de mesa.');
      },
    });
  }
}
