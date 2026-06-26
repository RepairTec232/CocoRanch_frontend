import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Refaccion } from '../app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class RefaccionesService {
  private apiUrl = `${environment.apiUrl}/refacciones`;

  constructor(private http: HttpClient) {}

  obtenerTodas(): Observable<Refaccion[]> {
    return this.http.get<Refaccion[]>(this.apiUrl);
  }

  guardar(refaccion: Refaccion): Observable<Refaccion> {
    return this.http.post<Refaccion>(this.apiUrl, refaccion);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  cotizar(marca: string, modelo: string, tipoFalla: string, calidad: string): Observable<Refaccion[]> {
    return this.http.get<Refaccion[]>(`${this.apiUrl}/cotizar?marca=${marca}&modelo=${modelo}&tipoFalla=${tipoFalla}&calidad=${calidad}`);
  }
}