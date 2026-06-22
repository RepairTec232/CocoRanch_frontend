import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReparacionesService } from '../../../services/reparaciones.service';
import { OrdenRespuesta } from '../../../app.interfaces';

@Component({
  selector: 'app-recibo-impresion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recibo-impresion.component.html',
  styleUrls: ['./recibo-impresion.component.scss']
})
export class ReciboImpresionComponent implements OnInit {
  orden!: OrdenRespuesta;
  cargando = true;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private reparacionesService: ReparacionesService
  ) {}

  ngOnInit(): void {
    // Obtenemos el ID de la URL
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.reparacionesService.obtenerOrdenPorId(Number(id)).subscribe({
        next: (data) => {
          this.orden = data;
          this.cargando = false;
          // 🔥 Disparamos la impresión 1 segundo después para asegurar que el HTML ya se pintó
          setTimeout(() => {
            window.print();
          }, 1000);
        },
        error: (err) => {
          console.error('Error al cargar el recibo', err);
          this.router.navigate(['/dashboard']); // Si falla, lo regresamos al tablero
        }
      });
    }
  }

  // Utilidad para saber cuánto falta por pagar
  calcularRestante(): number {
    const total = this.orden.costoEstimado || 0;
    const abono = this.orden.anticipo || 0;
    return total - abono;
  }
}