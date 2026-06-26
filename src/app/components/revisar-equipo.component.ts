import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ReparacionesService } from '../services/reparaciones.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-revisar-equipo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './revisar-equipo.component.html',
})
export class RevisarEquipoComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private reparacionesService = inject(ReparacionesService);

  reparacionForm!: FormGroup;
  ordenId!: number;
  cargando: boolean = true;

  // Lista de estatus disponibles para el select de HTML
  listaEstatus: string[] = [
    'RECIBIDO',
    'EN_REVISION',
    'ESPERANDO_REPUESTO',
    'REPARADO',
    'ENTREGADO',
  ];

  ngOnInit(): void {
    // 1. Inicializamos el formulario con los mismos campos
    this.initForm();

    // 2. Capturamos el ID de la URL
    this.ordenId = Number(this.route.snapshot.paramMap.get('id'));

    if (this.ordenId) {
      this.cargarDatosOrden();
    }
  }

  initForm() {
    this.reparacionForm = this.fb.group({
      // Datos de cliente (Deshabilitados porque usualmente no cambian al revisar)
      nombreCliente: [{ value: '', disabled: true }],
      telefonoCliente: [{ value: '', disabled: true }],

      // Datos del equipo
      equipoDetalle: [{ value: '', disabled: true }],
      fallaReportada: ['', Validators.required],

      // LO QUE SÍ VAMOS A MODIFICAR FÁCILMENTE
      estado: ['', Validators.required],
      diagnosticoTecnico: [''],
      costoTotal: [0],
    });
  }

  cargarDatosOrden() {
    this.reparacionesService.obtenerOrdenPorId(this.ordenId).subscribe({
      next: (orden) => {
        // Ahora que la interfaz tiene los campos, patchValue funcionará sin errores
        this.reparacionForm.patchValue({
          nombreCliente: orden.nombreCliente,
          telefonoCliente: orden.telefonoCliente,
          equipoDetalle: orden.equipoDetalle,
          fallaReportada: orden.fallaReportada,
          estado: orden.estado,
          diagnosticoTecnico: orden.diagnosticoTecnico || '',
          costoTotal: orden.costoTotal || orden.costoEstimado || 0,
        });
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al traer la orden:', err);
        this.cargando = false;
      },
    });
  }

  guardarCambios() {
    if (this.reparacionForm.invalid) return;

    const datosModificados = this.reparacionForm.getRawValue();

    // Corregido el formato del observer con "error: (err) =>"
    this.reparacionesService
      .actualizarOrden(this.ordenId, datosModificados)
      .subscribe({
        next: () => {
          console.log('¡Estatus y datos actualizados con éxito!');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          console.error('Error al actualizar', err);
        },
      });
  }

  cancelar() {
    this.router.navigate(['/dashboard']);
  }
}
