import { Component, OnInit } from '@angular/core';
import { RestauranteService } from '../../services/restaurante.service';
import { Mesa } from '../../models/restaurante.models';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PedidoExterno } from '../../models/pedido.model';
import { FormsModule } from '@angular/forms';
import { PedidoExternoService } from '../../services/pedido-externo.service';
import { ProductoService, Producto } from '../../services/producto.service';

@Component({
  selector: 'app-mapa-mesas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mapa-mesas.component.html',
  styleUrls: ['./mapa-mesas.component.scss'],
})
export class MapaMesasComponent implements OnInit {
  mesas: Mesa[] = [];
  pedidosExternos: PedidoExterno[] = [];
  mostrarFormulario = false;
  nuevoPedido: PedidoExterno = this.inicializarPedido();

  // VARIABLES DEL MENÚ UNIFICADAS
  menuProductos: Producto[] = [];
  platillosSeleccionados: { producto: Producto; cantidad: number }[] = [];
  productoActualId: number | null = null;
  cantidadActual: number = 1;

  constructor(
    private service: RestauranteService,
    private router: Router,
    private pedidoExternoService: PedidoExternoService,
    private productoService: ProductoService,
  ) {}

  ngOnInit(): void {
    this.cargarMesas();
    this.cargarPedidos();
    this.cargarMenu();
  }

  cargarMenu(): void {
    this.productoService.obtenerActivos().subscribe({
      next: (productos) => {
        this.menuProductos = productos;
      },
      error: (err) =>
        console.error('Error al obtener el menú desde PostgreSQL:', err),
    });
  }

  cargarMesas() {
    this.service.getMesas().subscribe((data) => (this.mesas = data));
  }

  cargarPedidos() {
    this.pedidoExternoService.obtenerPedidosPendientes().subscribe({
      next: (pedidos) => (this.pedidosExternos = pedidos),
      error: (err) => console.error('Error cargando pedidos', err),
    });
  }

  seleccionarMesa(mesa: Mesa) {
    if (mesa.estado === 'LIBRE') {
      if (confirm(`¿Desea abrir la Mesa ${mesa.numero}?`)) {
        this.service.abrirOrden(mesa.id).subscribe((nuevaOrden) => {
          this.router.navigate(['/comanda', nuevaOrden.id]);
        });
      }
    } else {
      this.service.getOrdenActiva(mesa.id).subscribe((orden) => {
        this.router.navigate(['/comanda', orden.id]);
      });
    }
  }

  abrirNuevoPedido(): void {
    this.mostrarFormulario = true;
    this.nuevoPedido = this.inicializarPedido();
    this.platillosSeleccionados = []; // <--- LIMPIA EL CARRITO
    this.productoActualId = null;
    this.cantidadActual = 1;
  }

  agregarPlatillo(): void {
    if (this.productoActualId && this.cantidadActual > 0) {
      const productoFind = this.menuProductos.find(
        (p) => p.id == this.productoActualId,
      );
      if (productoFind) {
        // Guarda correctamente en platillosSeleccionados
        this.platillosSeleccionados.push({
          producto: productoFind,
          cantidad: this.cantidadActual,
        });

        this.productoActualId = null;
        this.cantidadActual = 1;
      }
    }
  }

  quitarPlatillo(index: number): void {
    this.platillosSeleccionados.splice(index, 1);
  }

  guardarPedido(): void {
    if (!this.nuevoPedido.cliente) {
      alert('El nombre del cliente es obligatorio.');
      return;
    }

    // 1. AHORA SÍ LEEMOS LA VARIABLE CORRECTA
    if (this.platillosSeleccionados.length === 0) {
      alert('Debe agregar al menos un platillo al pedido.');
      return;
    }

    // 2. ARMAMOS EL TEXTO PARA JAVA ("ID,CANTIDAD|ID,CANTIDAD")
    this.nuevoPedido.pedido = this.platillosSeleccionados
      .map(
        (item) =>
          `${item.producto.id},${item.cantidad},${item.producto.precio}`,
      )
      .join('|');

    // 3. ARMAMOS EL TEXTO VISUAL PARA LA TABLA
    this.nuevoPedido.detallePedido = this.platillosSeleccionados
      .map((item) => `${item.cantidad}x ${item.producto.nombre}`)
      .join(', ');

    // 4. ENVIAMOS AL BACKEND
    this.pedidoExternoService.crearPedido(this.nuevoPedido).subscribe({
      next: (pedidoGuardado) => {
        // Truco visual para la tabla

        this.pedidosExternos.unshift(pedidoGuardado);
        this.mostrarFormulario = false;
      },
      error: (err) => {
        alert('Error al guardar el pedido en base de datos');
        console.error(err);
      },
    });
  }

  private inicializarPedido(): PedidoExterno {
    return {
      fecha: new Date(),
      cliente: '',
      telefono: '',
      detallePedido: '',
      pedido: '',
      detalle: '',
      tipo: 'Para llevar',
      estatus: 'Pendiente',
    };
  }

  cambiarEstatus(pedido: PedidoExterno): void {
    let nuevoEstatus: 'Pendiente' | 'Listo' | 'Entregado' = 'Pendiente';

    if (pedido.estatus === 'Pendiente') {
      nuevoEstatus = 'Listo';
    } else if (pedido.estatus === 'Listo') {
      nuevoEstatus = 'Entregado';
    }

    if (pedido.id) {
      this.pedidoExternoService
        .actualizarEstatus(pedido.id, nuevoEstatus)
        .subscribe({
          next: () => {
            // Solo actualizamos la propiedad local para refrescar la tabla/badge visual
            pedido.estatus = nuevoEstatus;

            // ¡IMPORTANTE! Se elimina el .filter() de aquí.
            // El pedido debe seguir visible en pantalla aunque esté "Entregado"
            // para que el cajero pueda presionar el botón "Cobrar".
          },
          error: (err) => console.error('Error actualizando estatus', err),
        });
    }
  }

  // 2. Proceso de Cobro (SÓLO elimina si el cobro fue exitoso)
  cobrarPedido(pedido: PedidoExterno): void {
    if (confirm(`¿Proceder al cobro del pedido de ${pedido.cliente}?`)) {
      if (pedido.id) {
        this.pedidoExternoService.crearOrdenDePedido(pedido.id).subscribe({
          next: (nuevaOrden) => {
            // EL COBRO FUE EXITOSO: Ahora sí lo quitamos de la vista activa
            this.pedidosExternos = this.pedidosExternos.filter(
              (p) => p.id !== pedido.id,
            );

            // Redirigimos a la comanda o ticket generado
            this.router.navigate(['/comanda', nuevaOrden.id]);
          },
          error: (err) => {
            console.error('Error al generar la orden de cobro', err);
            alert(
              'Hubo un problema al procesar el cobro. El pedido NO se ha eliminado y sigue pendiente.',
            );
          },
        });
      }
    }
  }
}
