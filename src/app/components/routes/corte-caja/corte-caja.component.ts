import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CajaService } from '../../../services/caja.service';
import { MovimientoCaja, CorteCaja } from '../../../app.interfaces';

@Component({
  selector: 'app-corte-caja',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './corte-caja.component.html',
  styleUrls: []
})
export class CorteCajaComponent implements OnInit {
  // Pestañas
  vistaActual: 'HOY' | 'HISTORIAL' = 'HOY';

  // Datos
  movimientosHoy: MovimientoCaja[] = [];
  historialCortes: CorteCaja[] = [];
  
  // Totales
  totalIngresos = 0;
  totalEgresos = 0;
  saldoFinal = 0;

  // Formulario de Gastos/Ingresos Extra
  movimientoForm!: FormGroup;

  constructor(private fb: FormBuilder, private cajaService: CajaService) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarDatosHoy();
  }

  inicializarFormulario(): void {
    this.movimientoForm = this.fb.group({
      tipo: ['EGRESO', Validators.required],
      descripcion: ['', Validators.required],
      monto: ['', [Validators.required, Validators.min(1)]]
    });
  }

  cambiarVista(vista: 'HOY' | 'HISTORIAL') {
    this.vistaActual = vista;
    if (vista === 'HISTORIAL') this.cargarHistorial();
  }

  cargarDatosHoy(): void {
    // ⚠️ Esto fallará hasta que hagamos el backend
    this.cajaService.obtenerMovimientosHoy().subscribe({
      next: (data) => {
        this.movimientosHoy = data;
        this.calcularTotales();
      },
      error: (err) => console.error('Backend no listo aún', err)
    });
  }

  calcularTotales(): void {
    this.totalIngresos = this.movimientosHoy.filter(m => m.tipo === 'INGRESO').reduce((acc, curr) => acc + curr.monto, 0);
    this.totalEgresos = this.movimientosHoy.filter(m => m.tipo === 'EGRESO').reduce((acc, curr) => acc + curr.monto, 0);
    this.saldoFinal = this.totalIngresos - this.totalEgresos;
  }

  registrarMovimientoManual(): void {
    if (this.movimientoForm.invalid) return;
    
    this.cajaService.registrarMovimiento(this.movimientoForm.value).subscribe({
      next: () => {
        this.movimientoForm.reset({ tipo: 'EGRESO', monto: '' });
        this.cargarDatosHoy();
      }
    });
  }

  cerrarCaja(): void {
    if (confirm(`¿Estás seguro de cerrar la caja con un saldo de $${this.saldoFinal}?`)) {
      const nuevoCorte: CorteCaja = {
        totalIngresos: this.totalIngresos,
        totalEgresos: this.totalEgresos,
        saldoFinal: this.saldoFinal,
        observaciones: 'Corte realizado correctamente'
      };

      this.cajaService.guardarCorte(nuevoCorte).subscribe({
        next: () => {
          alert('¡Caja cerrada exitosamente!');
          this.cargarHistorial();
          this.cambiarVista('HISTORIAL');
        }
      });
    }
  }

  cargarHistorial(): void {
    this.cajaService.obtenerHistorialCortes().subscribe({
      next: (data) => this.historialCortes = data
    });
  }
}