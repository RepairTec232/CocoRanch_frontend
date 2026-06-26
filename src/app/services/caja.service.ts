import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { MovimientoCaja, CorteCaja } from '../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class CajaService {
  private apiUrl = `${environment.apiUrl}/caja`;

  constructor(private http: HttpClient) {}

  obtenerMovimientosHoy(): Observable<MovimientoCaja[]> {
    return this.http.get<MovimientoCaja[]>(`${this.apiUrl}/movimientos/hoy`);
  }

  registrarMovimiento(movimiento: MovimientoCaja): Observable<MovimientoCaja> {
    return this.http.post<MovimientoCaja>(`${this.apiUrl}/movimientos`, movimiento);
  }

  guardarCorte(corte: CorteCaja): Observable<CorteCaja> {
    return this.http.post<CorteCaja>(`${this.apiUrl}/cortes`, corte);
  }

  obtenerHistorialCortes(): Observable<CorteCaja[]> {
    return this.http.get<CorteCaja[]>(`${this.apiUrl}/cortes`);
  }
}