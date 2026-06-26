import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RefaccionesService } from '../../../services/refacciones.service';
import { Refaccion } from '../../../app.interfaces';

@Component({
  selector: 'app-catalogo-refacciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './catalogo-refacciones.component.html',
  styleUrls: ['./catalogo-refacciones.component.scss']
})
export class CatalogoRefaccionesComponent implements OnInit {
  catalogoForm!: FormGroup;
  refacciones: Refaccion[] = [];
  cargando = false;

  constructor(
    private fb: FormBuilder,
    private refaccionesService: RefaccionesService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarCatalogo();
  }

  inicializarFormulario(): void {
    this.catalogoForm = this.fb.group({
      marca: ['', Validators.required],
      modelo: ['', Validators.required],
      tipoFalla: ['', Validators.required],
      calidad: ['', Validators.required],
      costoPieza: [0, [Validators.required, Validators.min(0)]],
      ganancia: [0, [Validators.required, Validators.min(0)]]
    });
  }

  // Previsualización matemática para el usuario (la BD hace el oficial)
  calcularPreviewTotal(): number {
    const costo = this.catalogoForm.get('costoPieza')?.value || 0;
    const ganancia = this.catalogoForm.get('ganancia')?.value || 0;
    return costo + 50 + ganancia; // Los $50 son fijos por el viaje
  }

  cargarCatalogo(): void {
    this.cargando = true;
    this.refaccionesService.obtenerTodas().subscribe({
      next: (data) => {
        this.refacciones = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar catálogo', err);
        this.cargando = false;
      }
    });
  }

  guardarProducto(): void {
    if (this.catalogoForm.invalid) {
      this.catalogoForm.markAllAsTouched();
      return;
    }

    const nuevoProducto: Refaccion = this.catalogoForm.value;
    
    this.refaccionesService.guardar(nuevoProducto).subscribe({
      next: (productoGuardado) => {
        alert('Producto agregado al inventario');
        this.catalogoForm.reset({ costoPieza: 0, ganancia: 0 }); // Limpiamos el form
        this.cargarCatalogo(); // Recargamos la tabla
      },
      error: (err) => console.error('Error al guardar', err)
    });
  }

  eliminarProducto(id: number | undefined): void {
    if (!id) return;
    if (confirm('¿Estás seguro de eliminar este producto del catálogo?')) {
      this.refaccionesService.eliminar(id).subscribe({
        next: () => this.cargarCatalogo(),
        error: (err) => console.error('Error al eliminar', err)
      });
    }
  }
}