import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private apiUrl = 'http://localhost:8080/api/clientes';

  constructor(private http: HttpClient) {}

  buscarClientes(termino: string) {
    return this.http.get<any[]>(`${this.apiUrl}/buscar?termino=${termino}`);
  }
  guardarCliente(cliente: any) {
    return cliente.id ? this.http.put(`${this.apiUrl}/${cliente.id}`, cliente) 
                      : this.http.post(this.apiUrl, cliente);
  }
  eliminarCliente(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}