import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray, // 👈 IMPORTANTE: Agregamos FormArray
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ReparacionesService } from '../services/reparaciones.service';
import { RefaccionesService } from '../services/refacciones.service'; // 👈 IMPORTAMOS EL CATÁLOGO
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
  clienteExiste = false;
  cargandoCliente = false;
  clienteIdActual: number | null = null;

  // 📦 Variables para el Catálogo Inteligente
  catalogoCompleto: any[] = [];
  marcasUnicas: string[] = [];
  modelosUnicos: string[] = [];

  historialCliente: any[] = [];

  constructor(
    private fb: FormBuilder,
    private reparacionesService: ReparacionesService,
    private refaccionesService: RefaccionesService, // Inyectamos servicio
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarCatalogo();
  }

  inicializarFormulario(): void {
    this.reparacionForm = this.fb.group({
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      nombreCompleto: ['', Validators.required],
      tipoEquipo: ['CELULAR', Validators.required],
      marca: ['', Validators.required],
      modelo: ['', Validators.required],
      numeroSerie: [''],

      // 🔥 EL CORAZÓN DEL COTIZADOR (Arreglo dinámico)
      detalles: this.fb.array([]),

      costoEstimado: ['', [Validators.required, Validators.min(0)]],
      anticipo: ['', [Validators.min(0)]],
    });

    // Escuchar cuando el usuario escriba la Marca para filtrar los Modelos
    this.reparacionForm
      .get('marca')
      ?.valueChanges.subscribe((marcaSeleccionada) => {
        this.modelosUnicos = [
          ...new Set(
            this.catalogoCompleto
              .filter(
                (r) =>
                  r.marca.toLowerCase() === marcaSeleccionada.toLowerCase(),
              )
              .map((r) => r.modelo),
          ),
        ];
      });

    // Agregamos una fila vacía por defecto al iniciar
    this.agregarDetalle();
  }

  // 📦 Cargar catálogo desde Spring Boot
  cargarCatalogo(): void {
    this.refaccionesService.obtenerTodas().subscribe((data) => {
      this.catalogoCompleto = data;
      // Extraemos marcas sin repetir
      this.marcasUnicas = [...new Set(data.map((item) => item.marca))];
    });
  }

  // 🔄 Obtener las opciones de fallas SOLO para la marca y modelo escritos
  get refaccionesDelModeloActual() {
    const marca = this.reparacionForm.get('marca')?.value;
    const modelo = this.reparacionForm.get('modelo')?.value;
    return this.catalogoCompleto.filter(
      (r) =>
        r.marca.toLowerCase() === marca?.toLowerCase() &&
        r.modelo.toLowerCase() === modelo?.toLowerCase(),
    );
  }

  // ==========================================
  // 🔥 LÓGICA DEL FORM ARRAY (MÚLTIPLES FALLAS)
  // ==========================================
  get detalles(): FormArray {
    return this.reparacionForm.get('detalles') as FormArray;
  }

  agregarDetalle(): void {
    const fila = this.fb.group({
      esCatalogo: [true],
      refaccionId: [''],
      descripcionManual: [''],
      cantidad: [1, [Validators.required, Validators.min(1)]],

      // 🔄 CORREGIDO: Cambiamos 0 por '' para que aparezca limpio de inicio
      precioUnitario: ['', [Validators.required, Validators.min(0)]],
    });

    // Tus suscripciones de abajo se quedan exactamente igual...
    fila.get('refaccionId')?.valueChanges.subscribe((idSeleccionado) => {
      if (idSeleccionado) {
        const producto = this.catalogoCompleto.find(
          (r) => r.id == idSeleccionado,
        );
        if (producto) {
          fila.patchValue(
            { precioUnitario: producto.precioTotalCliente },
            { emitEvent: false },
          );
          this.recalcularTotal();
        }
      }
    });

    fila.get('cantidad')?.valueChanges.subscribe(() => this.recalcularTotal());
    fila
      .get('precioUnitario')
      ?.valueChanges.subscribe(() => this.recalcularTotal());

    this.detalles.push(fila);
  }

  removerDetalle(index: number): void {
    if (this.detalles.length > 1) {
      this.detalles.removeAt(index);
      this.recalcularTotal();
    }
  }

  recalcularTotal(): void {
    let granTotal = 0;
    this.detalles.controls.forEach((fila) => {
      const cant = fila.get('cantidad')?.value || 0;
      const precio = fila.get('precioUnitario')?.value || 0;
      granTotal += cant * precio;
    });
    this.reparacionForm.patchValue({ costoEstimado: granTotal });
  }

  // Resto del código (buscarCliente, etc)...
buscarCliente(): void {
    // 🎤 1. Revisamos qué nombre de control estás usando
    const telefono = this.reparacionForm.get('telefonoCliente')?.value; // Cambia esto si tu form usa 'telefono'
    
    console.log('👀 1. Di clic fuera de la cajita. Teléfono leído:', telefono);

    if (!telefono) {
      console.log('❌ 2. El teléfono está vacío o no lo encontró en el formulario.');
      return;
    }

    if (telefono.length !== 10) {
      console.log('❌ 2. El teléfono no tiene 10 dígitos. Tiene:', telefono.length);
      return;
    }

    console.log('✅ 3. El teléfono es válido. Yendo a buscar a Java...');
    this.cargandoCliente = true;
    this.historialCliente = []; 

    this.http
      .get<any>(`${environment.apiUrl}/clientes/telefono/${telefono}`)
      .subscribe({
        next: (cliente) => {
          console.log('📥 4. Java respondió con éxito:', cliente);
          if (cliente) {
            this.clienteExiste = true;
            this.clienteIdActual = cliente.id; 
            this.reparacionForm.patchValue({
              nombreCompleto: cliente.nombreCompleto,
            });
            console.log('✅ 5. Cliente encontrado. Buscando historial...');
            this.cargarHistorialCliente(cliente.id);
          } else {
            console.log('👤 5. Es un cliente nuevo (Java mandó null).');
            this.clienteExiste = false;
            this.clienteIdActual = null;
          }
          this.cargandoCliente = false;
        },
        error: (err) => {
          console.error('🚨 4. ¡ERROR DE CONEXIÓN O DE ANGULAR!', err);
          this.clienteExiste = false;
          this.clienteIdActual = null;
          this.cargandoCliente = false;
        },
      });
  }
  
  cargarHistorialCliente(clienteId: number): void {
    this.http
      .get<any[]>(`${environment.apiUrl}/api/ordenes/cliente/${clienteId}`) // Ajusta la ruta exacta de tu Java
      .subscribe({
        next: (historial) => {
          this.historialCliente = historial;
        },
        error: (err) =>
          console.error('Error al traer el historial del cliente', err),
      });
  }

  guardar(): void {
    if (this.reparacionForm.invalid) {
      this.reparacionForm.markAllAsTouched();
      return;
    }

    const formValues = this.reparacionForm.value;

    // 🔨 CONVERTIMOS LA LISTA DINÁMICA EN TEXTO PARA EL BACKEND
    // 🔨 AHORA GUARDAMOS: "1x Pantalla (Incell) [$800.00]"
    const textoFallas = formValues.detalles
      .map((d: any) => {
        let nombre = '';
        if (d.esCatalogo && d.refaccionId) {
          const prod = this.catalogoCompleto.find((r) => r.id == d.refaccionId);
          nombre = `${d.cantidad}x ${prod?.tipoFalla} (${prod?.calidad})`;
        } else {
          nombre = `${d.cantidad}x ${d.descripcionManual} (Otro)`;
        }
        return `${nombre} [$${d.precioUnitario}]`; // <- Le pegamos el precio entre corchetes
      })
      .join(' + ');

    const payload = {
      cliente: {
        id: this.clienteIdActual,
        telefono: formValues.telefono,
        nombreCompleto: formValues.nombreCompleto,
      },
      equipo: {
        tipo: formValues.tipoEquipo,
        marca: formValues.marca,
        modelo: formValues.modelo,
        numeroSerie: formValues.numeroSerie || '',
      },
      fallaReportada: textoFallas, // 👈 Se envía: "1x Pantalla (OLED) + 2x Limpieza (Otro)"
      estado: 'RECIBIDO',
      costoEstimado: formValues.costoEstimado,
      anticipo: formValues.anticipo,
    };

    this.reparacionesService.crearOrden(payload).subscribe({
      next: (res) => {
        if (res && res.id) {
          this.router.navigate(['/recibo', res.id]);
        }
      },
      error: (err) => alert('Error al guardar'),
    });
  }
}
