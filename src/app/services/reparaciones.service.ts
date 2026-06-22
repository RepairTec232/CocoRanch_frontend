import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrdenRespuesta } from '../app.interfaces';

@Injectable({
  providedIn: 'root',
})
export class ReparacionesService {
  private http = inject(HttpClient);

  // Apuntamos al endpoint que vimos en tu consola
  private apiUrl = `${environment.apiUrl}/ordenes`;

  // 1. Obtener todas para el tablero
  obtenerOrdenes(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // 2. Guardar una nueva orden
  crearOrden(datos: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, datos);
  }

  obtenerOrdenPorId(id: number): Observable<OrdenRespuesta> {
    return this.http.get<OrdenRespuesta>(`${this.apiUrl}/${id}`);
  }

  // 👇 NUEVO: Mandar los cambios de estatus y costos por PUT a Java
  actualizarOrden(id: number, datosModificados: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, datosModificados);
  }

  eliminarOrden(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  obtenerEstadisticasMensuales(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/estadisticas`);
  }

  obtenerFaltantesPorEntregar(): Observable<OrdenRespuesta[]> {
    return this.http.get<OrdenRespuesta[]>(`${this.apiUrl}/faltantes-entrega`);
  }
}
