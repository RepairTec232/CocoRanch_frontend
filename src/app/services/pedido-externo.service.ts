// src/app/services/pedido-externo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // <-- Usando tu environment local
import { PedidoExterno } from '../models/pedido.model';

@Injectable({
  providedIn: 'root',
})
export class PedidoExternoService {
  // Apunta a http://localhost:8080/api/pedidos-externos (Basado en tu entorno de desarrollo)
  private apiUrl = `${environment.apiUrl}/pedidos-externos`;

  constructor(private http: HttpClient) {}

  obtenerPedidosPendientes(): Observable<PedidoExterno[]> {
    return this.http.get<PedidoExterno[]>(this.apiUrl);
  }

  crearPedido(pedido: PedidoExterno): Observable<PedidoExterno> {
    return this.http.post<PedidoExterno>(this.apiUrl, pedido);
  }

  actualizarEstatus(id: number, estatus: string): Observable<PedidoExterno> {
    // Si tu backend espera un objeto completo, puedes cambiar estatus a un objeto Parcial o completo.
    return this.http.put<PedidoExterno>(`${this.apiUrl}/${id}/estatus`, {
      estatus,
    });
  }

  crearOrdenDePedido(id: number): Observable<any> {
    // Cambia 'any' por tu modelo Orden
    return this.http.post<any>(`${this.apiUrl}/${id}/cobrar`, {});
  }
}
