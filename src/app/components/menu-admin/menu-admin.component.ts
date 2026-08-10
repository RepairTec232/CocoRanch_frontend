import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para los inputs
import { RestauranteService } from '../../services/restaurante.service';
import { Producto } from '../../models/restaurante.models';

@Component({
  selector: 'app-menu-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-admin.component.html',
})
export class MenuAdminComponent implements OnInit {
  productos: Producto[] = [];

  // Objeto temporal para el formulario
  productoActual: Producto = this.nuevoProductoVacio();
  modoEdicion: boolean = false;

  constructor(private service: RestauranteService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.service.getProductos().subscribe((data) => (this.productos = data));
  }

  nuevoProductoVacio(): Producto {
    // Le asignamos el categoriaId: 1 para que caiga en "Alimentos"
    return {
      nombre: '',
      descripcion: '',
      precio: null,
      activo: true,
      categoriaId: 1,
    };
  }

  seleccionarProducto(prod: Producto): void {
    this.productoActual = { ...prod }; // Hacemos una copia para no editar directamente la tabla
    this.modoEdicion = true;
  }

  cancelarEdicion(): void {
    this.productoActual = this.nuevoProductoVacio();
    this.modoEdicion = false;
  }

  guardar(): void {
    this.service.guardarProducto(this.productoActual).subscribe(() => {
      this.cargarProductos();
      this.cancelarEdicion();
      alert('¡Platillo guardado correctamente!');
    });
  }

  eliminar(id: number | undefined): void {
    if (id && confirm('¿Estás seguro de eliminar este platillo?')) {
      this.service.eliminarProducto(id).subscribe(() => {
        this.cargarProductos();
      });
    }
  }
}
