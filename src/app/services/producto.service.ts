// src/app/services/producto.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  activo?: boolean;
  categoria?: Categoria;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  // Apunta a http://localhost:8080/api/productos/activos
  private apiUrl = `${environment.apiUrl}/productos/activos`;

  constructor(private http: HttpClient) { }

  obtenerActivos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }
}