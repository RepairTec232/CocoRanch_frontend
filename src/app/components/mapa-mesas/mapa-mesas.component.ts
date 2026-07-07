import { Component, OnInit } from '@angular/core';
import { RestauranteService } from '../../services/restaurante.service';
import { Mesa } from '../../models/restaurante.models';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mapa-mesas',
  standalone: true, // Asegúrate de que esto esté en true
  imports: [CommonModule], // 2. Agrega CommonModule aquí
  templateUrl: './mapa-mesas.component.html',
  styleUrls: []
})
export class MapaMesasComponent implements OnInit {
  mesas: Mesa[] = [];

  constructor(private service: RestauranteService, private router: Router) {}

  ngOnInit(): void {
    this.cargarMesas();
  }

  cargarMesas() {
    this.service.getMesas().subscribe(data => this.mesas = data);
  }

  seleccionarMesa(mesa: Mesa) {
    if (mesa.estado === 'LIBRE') {
      if (confirm(`¿Desea abrir la Mesa ${mesa.numero}?`)) {
        this.service.abrirOrden(mesa.id).subscribe(nuevaOrden => {
          this.router.navigate(['/comanda', nuevaOrden.id]);
        });
      }
    } else {
      // Si ya está ocupada, buscamos su orden activa para seguir pidiendo
      this.service.getOrdenActiva(mesa.id).subscribe(orden => {
        this.router.navigate(['/comanda', orden.id]);
      });
    }
  }
}