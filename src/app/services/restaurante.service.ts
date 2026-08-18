import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mesa, Orden, Producto } from '../models/restaurante.models';

@Injectable({
  providedIn: 'root',
})
export class RestauranteService {
  private apiURL = 'http://localhost:8080/api';

  constructor(private readonly http: HttpClient) {}

  // Mesas
  getMesas(): Observable<Mesa[]> {
    return this.http.get<Mesa[]>(`${this.apiURL}/mesas`);
  }

  // Comandas
  abrirOrden(mesaId: number): Observable<Orden> {
    return this.http.post<Orden>(
      `${this.apiURL}/ordenes/abrir/mesa/${mesaId}`,
      {},
    );
  }

  getOrdenActiva(mesaId: number): Observable<Orden> {
    return this.http.get<Orden>(`${this.apiURL}/ordenes/mesa/${mesaId}`);
  }

  agregarProducto(
    ordenId: number,
    productoId: number,
    cantidad: number,
    notas: string,
  ): Observable<any> {
    const params = { productoId, cantidad, notas };
    return this.http.post(`${this.apiURL}/ordenes/${ordenId}/items`, null, {
      params,
    });
  }

  // Menú
  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiURL}/productos/activos`);
  }

  // Pagos y Caja
  cobrarOrden(
    ordenId: number,
    metodoPago: string,
    propina: number,
  ): Observable<any> {
    const payload = {
      metodoPago: metodoPago,
      propina: propina,
    };
    return this.http.put(`${this.apiURL}/ordenes/${ordenId}/pagar`, payload);
  }
  // CRUD de Productos (Menú)
  guardarProducto(producto: Producto): Observable<Producto> {
    if (producto.id) {
      // Si tiene ID, es una actualización (PUT)
      return this.http.put<Producto>(
        `${this.apiURL}/productos/${producto.id}`,
        producto,
      );
    } else {
      // Si no tiene ID, es un producto nuevo (POST)
      return this.http.post<Producto>(`${this.apiURL}/productos`, producto);
    }
  }

  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiURL}/productos/${id}`);
  }

  // Obtener una orden específica por su ID de Comanda
  getOrdenById(ordenId: number): Observable<Orden> {
    return this.http.get<Orden>(`${this.apiURL}/ordenes/${ordenId}`);
  }

  // Eliminar un platillo de la cuenta
  eliminarDetalle(ordenId: number, detalleId: number): Observable<any> {
    return this.http.delete(
      `${this.apiURL}/ordenes/${ordenId}/detalles/${detalleId}`,
    );
  }

  // Guardar las instrucciones especiales (Ej. "Sin cebolla")
  actualizarNota(
    ordenId: number,
    detalleId: number,
    notas: string,
  ): Observable<any> {
    // Mandamos la nota como un texto simple en el body
    return this.http.put(
      `${this.apiURL}/ordenes/${ordenId}/detalles/${detalleId}/nota`,
      notas,
    );
  }

  cancelarOrden(ordenId: number): Observable<any> {
    return this.http.delete(`${this.apiURL}/ordenes/${ordenId}/cancelar`);
  }

  getArticulosVendidosPorCorte(cierreId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiURL}/caja/${cierreId}/articulos-vendidos`,
    );
  }

  // ==========================================
  // MÓDULO DE FACTURACIÓN
  // ==========================================

  buscarClientesFacturacion(termino: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiURL}/facturacion/clientes/buscar?termino=${termino}`,
    );
  }

  guardarClienteFacturacion(cliente: any): Observable<any> {
    return this.http.post<any>(`${this.apiURL}/facturacion/clientes`, cliente);
  }

  obtenerOrdenParaFacturar(ordenId: number): Observable<any> {
    return this.http.get<any>(`${this.apiURL}/facturacion/ordenes/${ordenId}`);
  }

  cambiarMesa(ordenId: number, nuevaMesaId: number): Observable<any> {
    return this.http.put<any>(`${this.apiURL}/ordenes/${ordenId}/cambiar-mesa/${nuevaMesaId}`, {});
  }

  cancelarPedido(id: number): Observable<any> {
    return this.http.put(`${this.apiURL}/pedidos-externos/${id}/cancelar`, {});
  }
}
