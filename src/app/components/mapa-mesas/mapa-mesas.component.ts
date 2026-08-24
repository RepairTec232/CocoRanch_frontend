import { Component, OnInit } from '@angular/core';
import { RestauranteService } from '../../services/restaurante.service';
import { Mesa } from '../../models/restaurante.models';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PedidoExterno } from '../../models/pedido.model';
import { FormsModule } from '@angular/forms';
import { PedidoExternoService } from '../../services/pedido-externo.service';
import { ProductoService, Producto } from '../../services/producto.service';
import { ClienteService } from '../../services/cliente.service';

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

  mostrarCancelados: boolean = false;

  modoEdicion: boolean = false;
  pedidoEditandoId: number | null = null;

  terminoBusquedaCliente: string = '';
  clientesSugeridos: any[] = [];
  clienteSeleccionado: any = null;
  mostrarFormCliente: boolean = false;
  clienteForm: any = {};

  constructor(
    private service: RestauranteService,
    private router: Router,
    private pedidoExternoService: PedidoExternoService,
    private productoService: ProductoService,
    private clienteService: ClienteService,
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

  get pedidosFiltrados(): PedidoExterno[] {
    if (this.mostrarCancelados) {
      // Muestra ÚNICAMENTE los pedidos cancelados
      return this.pedidosExternos.filter((p) => p.estatus === 'Cancelado');
    }
    // Vista por defecto: Muestra pedidos activos (Pendiente, Listo, Entregado) y oculta los cancelados
    return this.pedidosExternos.filter((p) => p.estatus !== 'Cancelado');
  }

  // Método para alternar la vista
  toggleCancelados(): void {
    this.mostrarCancelados = !this.mostrarCancelados;
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
    this.modoEdicion = false;
    this.pedidoEditandoId = null;
    this.nuevoPedido = this.inicializarPedido();
    this.platillosSeleccionados = [];
    this.productoActualId = null;
    this.cantidadActual = 1;
    this.clienteSeleccionado = null;
    this.mostrarFormCliente = false;
    this.terminoBusquedaCliente = '';
  }

  abrirEditarPedido(pedido: PedidoExterno): void {
    this.modoEdicion = true;
    this.pedidoEditandoId = pedido.id || null;
    this.nuevoPedido = { ...pedido }; // Hacemos una copia para no alterar la tabla
    this.platillosSeleccionados = [];
    this.productoActualId = null;
    this.cantidadActual = 1;

    if (pedido.telefono) {
      this.clienteService.buscarClientes(pedido.telefono).subscribe((data) => {
        if (data && data.length > 0) {
          this.clienteSeleccionado = data[0];
        }
      });
    }

    // Reconstruir el carrito leyendo la propiedad 'pedido' ("ID,CANTIDAD,PRECIO|...")
    if (pedido.pedido) {
      const items = pedido.pedido.split('|');
      items.forEach((item) => {
        const partes = item.split(',');
        if (partes.length >= 2) {
          const prodId = Number(partes[0]);
          const cantidad = Number(partes[1]);
          // Buscamos el producto en el men  cargado
          const productoOriginal = this.menuProductos.find(
            (mp) => mp.id === prodId,
          );
          if (productoOriginal) {
            this.platillosSeleccionados.push({
              producto: productoOriginal,
              cantidad: cantidad,
            });
          }
        }
      });
    }

    this.mostrarFormulario = true;
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

    // 4. ENVIAMOS AL BACKEND DEPENDIENDO DEL MODO
    if (this.modoEdicion && this.pedidoEditandoId) {
      this.pedidoExternoService
        .editarPedido(this.pedidoEditandoId, this.nuevoPedido)
        .subscribe({
          next: (pedidoActualizado) => {
            // Actualizamos visualmente la tabla
            const index = this.pedidosExternos.findIndex(
              (p) => p.id === this.pedidoEditandoId,
            );
            if (index !== -1) {
              this.pedidosExternos[index] = pedidoActualizado;
            }
            this.mostrarFormulario = false;
          },
          error: (err) => {
            alert('Error al actualizar el pedido en base de datos');
            console.error(err);
          },
        });
    } else {
      this.pedidoExternoService.crearPedido(this.nuevoPedido).subscribe({
        next: (pedidoGuardado) => {
          this.pedidosExternos.unshift(pedidoGuardado);
          this.mostrarFormulario = false;
        },
        error: (err) => {
          alert('Error al guardar el pedido en base de datos');
          console.error(err);
        },
      });
    }
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

  cancelarPedido(pedido: PedidoExterno): void {
    if (
      confirm(
        `¿Estás seguro de que deseas cancelar el pedido de ${pedido.cliente}? Esto no generará cobro.`,
      )
    ) {
      // Validamos que el pedido tenga un ID válido antes de enviarlo
      if (!pedido.id) return;

      // Descomentamos y usamos el servicio HTTP
      this.service.cancelarPedido(pedido.id).subscribe({
        next: (pedidoActualizado) => {
          // Si el backend responde OK, actualizamos la vista
          pedido.estatus = 'Cancelado';

          // Opcional: Si quieres que desaparezca de la pantalla del cajero
          // this.pedidosExternos = this.pedidosExternos.filter(p => p.id !== pedido.id);

          alert('El pedido ha sido cancelado exitosamente.');
        },
        error: (err) => {
          console.error('Error en el servidor:', err);
          alert(
            'Hubo un problema de conexión local al intentar cancelar el pedido.',
          );
        },
      });
    }
  }

  buscarCliente(): void {
    const termino = this.terminoBusquedaCliente.trim();
    if (termino.length === 0) {
      this.clientesSugeridos = [];
      return;
    }
    this.clienteService.buscarClientes(termino).subscribe({
      next: (data) => (this.clientesSugeridos = data),
      error: (err) => console.error('Error buscando clientes', err),
    });
  }

  seleccionarCliente(cliente: any): void {
    this.clienteSeleccionado = { ...cliente };
    this.clientesSugeridos = [];
    this.terminoBusquedaCliente = '';
    this.mostrarFormCliente = false;
    // Asociar al pedido
    this.nuevoPedido.cliente =
      cliente.nombre + (cliente.apellido ? ' ' + cliente.apellido : '');
    this.nuevoPedido.telefono = cliente.telefono;
  }

  prepararNuevoCliente(): void {
    this.clienteSeleccionado = null;
    this.clienteForm = {
      nombre: '',
      apellido: '',
      telefono: '',
      domicilio: '',
      referenciaDomicilio: '',
      alergias: '',
    };
    this.mostrarFormCliente = true;
    this.clientesSugeridos = [];
  }

  editarClienteActivo(): void {
    this.clienteForm = { ...this.clienteSeleccionado };
    this.mostrarFormCliente = true;
  }

  guardarClienteBD(): void {
    if (!this.clienteForm.nombre || !this.clienteForm.telefono) {
      alert('El nombre y el teléfono son obligatorios.');
      return;
    }

    // Si no es pedido para llevar, limpiamos los campos de domicilio por consistencia
    if (this.nuevoPedido.tipo !== 'Para llevar') {
      this.clienteForm.domicilio = '';
      this.clienteForm.referenciaDomicilio = '';
    }

    this.clienteService.guardarCliente(this.clienteForm).subscribe({
      next: (res) => {
        this.seleccionarCliente(res);
        alert('Cliente registrado correctamente.');
      },
      error: (err) =>
        alert(
          err.error?.message ||
            'Error al guardar el cliente en la base de datos.',
        ),
    });
  }
  eliminarClienteActivo(): void {
    if (
      this.clienteSeleccionado?.id &&
      confirm('¿Eliminar este cliente de la base de datos?')
    ) {
      this.clienteService
        .eliminarCliente(this.clienteSeleccionado.id)
        .subscribe({
          next: () => {
            this.clienteSeleccionado = null;
            this.nuevoPedido.cliente = '';
            this.nuevoPedido.telefono = '';
            alert('Cliente eliminado.');
          },
          error: (err) => console.error(err),
        });
    }
  }
}
