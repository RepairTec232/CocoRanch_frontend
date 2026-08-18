import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial.component.html'
})
export class HistorialComponent implements OnInit {
  private apiURL = 'http://localhost:8080/api/caja'; // Ajusta a tu puerto real
  
  resumenHoy: any = null;
  listaHistorial: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarResumenHoy();
    this.cargarHistorial();
  }

  cargarResumenHoy(): void {
    this.http.get(`${this.apiURL}/resumen-hoy`).subscribe((data) => {
      this.resumenHoy = data;
    });
  }

  cargarHistorial(): void {
    this.http.get<any[]>(`${this.apiURL}/historial`).subscribe((data) => {
      this.listaHistorial = data;
    });
  }

  hacerCorteCaja(): void {
    if (!this.resumenHoy || this.resumenHoy.granTotal === 0) {
      alert('No hay ventas registradas el día de hoy para realizar un corte.');
      return;
    }

    if (confirm(`¿Estás seguro de cerrar la caja de hoy con un total de $${this.resumenHoy.granTotal.toFixed(2)}? This action cannot be undone.`)) {
      this.http.post(`${this.apiURL}/cierre`, this.resumenHoy).subscribe({
        next: () => {
          alert('¡Corte de caja guardado con éxito en el histórico!');
          this.cargarResumenHoy(); // Se resetea o recalcula
          this.cargarHistorial();  // Actualiza la tabla inferior
          window.location.reload();
        },
        error: (err) => alert('Error al procesar el cierre: ' + err.message)
      });
    }
  }
}