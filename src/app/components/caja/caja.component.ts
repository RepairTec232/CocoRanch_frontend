import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RestauranteService } from '../../services/restaurante.service';
import { Orden } from '../../models/restaurante.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './caja.component.html',
  styleUrls: [],
})
export class CajaComponent implements OnInit {
  ordenId!: number;
  ordenActiva: Orden | null = null;

  metodoPago: 'EFECTIVO' | 'TARJETA' = 'EFECTIVO';
  propina: number = 0;

  porcentajeSeleccionado: number | string = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: RestauranteService,
  ) {}

  ngOnInit(): void {
    this.ordenId = Number(this.route.snapshot.paramMap.get('ordenId'));
    this.cargarOrden();
  }

  cargarOrden(): void {
    // UNIFICADO: Usamos getOrdenById igual que en la comanda
    this.service.getOrdenById(this.ordenId).subscribe({
      next: (data) => (this.ordenActiva = data),
      error: (err) => {
        console.error('Error al cargar la orden:', err);
        alert('Error al cargar la orden. Puede que ya esté pagada.');
        this.router.navigate(['/mesas']);
      },
    });
  }

  // Cálculos dinámicos reactivos para la interfaz
  get subtotal(): number {
    return this.ordenActiva ? this.ordenActiva.subtotal : 0;
  }

  get totalFinal(): number {
    // Si la propina queda vacía temporalmente en el input, la tomamos como 0
    const propinaLimpia = this.propina && this.propina > 0 ? this.propina : 0;
    return this.subtotal + propinaLimpia;
  }

  seleccionarMetodo(metodo: 'EFECTIVO' | 'TARJETA'): void {
    this.metodoPago = metodo;
  }

  procesarCobro(): void {
    if (confirm(`¿Confirmas el cobro por $${this.totalFinal.toFixed(2)}?`)) {
      this.service
        .cobrarOrden(this.ordenId, this.metodoPago, this.propina)
        .subscribe({
          next: (res) => {
            alert('¡Cobro exitoso! Mesa liberada.');
            this.router.navigate(['/mesas']); // Regresamos al mapa de mesas
          },
          error: (err) => alert('Error al procesar el pago: ' + err.message),
        });
    }
  }

  // Se ejecuta al dar clic en los botones de 5%, 10%, 15%, 20% o 0%
  seleccionarPorcentaje(porcentaje: number): void {
    this.porcentajeSeleccionado = porcentaje;

    if (porcentaje === 0) {
      this.propina = 0;
    } else {
      // Calcula el dinero real según el subtotal de la cuenta
      this.propina = Math.round(this.subtotal * (porcentaje / 100) * 100) / 100;
    }
  }

  // Se ejecuta si el cajero escribe una cantidad manual en el input
  cambiarPropinaManual(valor: number): void {
    this.porcentajeSeleccionado = 'custom';
    this.propina = valor >= 0 ? valor : 0;
  }

  // Cálculo dinámico del total final a pagar en la mesa
  get totalAPagar(): number {
    return this.subtotal + this.propina;
  }

  regresar(): void {
    this.router.navigate(['/mesas']);
  }
}
