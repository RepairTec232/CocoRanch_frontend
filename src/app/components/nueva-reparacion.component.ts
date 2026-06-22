import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ReparacionesService } from '../services/reparaciones.service'; // Nuestro servicio
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-nueva-reparacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './nueva-reparacion.component.html',
  styleUrls: [],
})
export class NuevaReparacionComponent implements OnInit {
  reparacionForm!: FormGroup;
  clienteExiste: boolean = false;
  cargandoCliente: boolean = false;
  clienteIdActual: number | null = null; // 👈 Guardamos el ID si el cliente ya existe

  constructor(
    private fb: FormBuilder,
    private reparacionesService: ReparacionesService,
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
  }

  inicializarFormulario(): void {
    this.reparacionForm = this.fb.group({
      // Datos del Cliente
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]], // 10 dígitos
      nombreCompleto: ['', Validators.required],
      email: ['', Validators.email],

      // Datos del Equipo
      tipoEquipo: ['CELULAR', Validators.required],
      marca: ['', Validators.required],
      modelo: ['', Validators.required],
      numeroSerie: [''],

      // Detalle de la Orden
      fallaReportada: ['', Validators.required],
      costoEstimado: [0, [Validators.required, Validators.min(0)]],
      anticipo: [0, [Validators.min(0)]]
    });
  }

  // LÓGICA DE SENIOR: Buscar cliente por WhatsApp/Teléfono al perder el foco (evento blur)
  buscarCliente(): void {
    const telefono = this.reparacionForm.get('telefono')?.value;

    if (!telefono || telefono.length !== 10) return;

    this.cargandoCliente = true;

    this.http
      .get<any>(`${environment.apiUrl}/clientes/telefono/${telefono}`)
      .subscribe({
        next: (cliente) => {
          if (cliente) {
            this.clienteExiste = true;
            this.clienteIdActual = cliente.id; // 👈 Guardamos el ID original de la BD

            this.reparacionForm.patchValue({
              nombreCompleto: cliente.nombreCompleto,
              email: cliente.email,
            });
          }
          this.cargandoCliente = false;
        },
        error: (err) => {
          // Si da 404, limpiamos el ID ya que es un cliente totalmente nuevo
          this.clienteExiste = false;
          this.clienteIdActual = null;
          this.cargandoCliente = false;
        },
      });
  }

  guardar(): void {
    console.log('🚨 ¡El botón verde sí fue presionado!');

    if (this.reparacionForm.invalid) {
      this.reparacionForm.markAllAsTouched();
      console.warn('Faltan campos obligatorios por llenar');
      return;
    }

    const formValues = this.reparacionForm.value;

    const objetoCliente = {
      id: this.clienteIdActual,
      telefono: formValues.telefono,
      nombreCompleto: formValues.nombreCompleto,
      email: formValues.email,
    };

    // 🔥 MODIFICADO: Agregamos costoEstimado y anticipo al cuerpo de envío
    const payload = {
      cliente: objetoCliente,
      equipo: {
        tipo: formValues.tipoEquipo, // 👈 ¡CORREGIDO! Cambiado de tipoEquipo a tipo para emparejar con tu entidad Java
        marca: formValues.marca,
        modelo: formValues.modelo,
        numeroSerie: formValues.numeroSerie || '',
        cliente: objetoCliente,
      },
      fallaReportada: formValues.fallaReportada,
      estado: 'RECIBIDO',
      costoEstimado: formValues.costoEstimado, // 👈 ¡NUEVO! Jala el valor del form
      anticipo: formValues.anticipo              // 👈 ¡NUEVO! Jala el valor del form
    };

    console.log('🚀 Enviando payload definitivo y alineado con Java:', payload);

    this.reparacionesService.crearOrden(payload).subscribe({
      next: (respuestaBD) => {
        console.log('✅ ¡Guardado exitoso!', respuestaBD);
        alert('¡Equipo y Orden registrados correctamente en la Base de Datos!');
        
        // 🖨️ MODIFICADO: En lugar de ir al dashboard, si respuestaBD trae el id que guardó Spring Boot,
        // mandamos al usuario directamente a la pantalla de impresión del recibo
        if (respuestaBD && respuestaBD.id) {
          this.router.navigate(['/recibo', respuestaBD.id]);
        } else {
          // Respaldo por si tu controlador en Java no regresa la orden guardada entera
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        console.error('❌ Error al guardar:', error);
        alert(
          'Hubo un error al procesar el guardado. Revisa la consola de Spring Boot.',
        );
      },
    });
  }
}