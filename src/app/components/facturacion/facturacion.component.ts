import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestauranteService } from '../../services/restaurante.service';
import { ClienteFacturacion, Orden } from '../../models/restaurante.models';

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturacion.component.html',
})
export class FacturacionComponent {
  // Buscador de Clientes
  terminoBusqueda: string = '';
  clientesEncontrados: ClienteFacturacion[] = [];

  // Cliente Activo
  clienteActual: ClienteFacturacion = this.clienteVacio();

  // Buscador de Tickets
  numeroTicketBuscado: number | null = null;
  ordenEncontrada: Orden | null = null;
  errorTicket: string = '';

  constructor(private service: RestauranteService) {}

  clienteVacio(): ClienteFacturacion {
    return {
      rfc: '',
      razonSocial: '',
      codigoPostal: '',
      regimenFiscal: '',
      telefono: '',
      email: '',
    };
  }

  // REPARADO: Buscador reactivo instantáneo
  buscarCliente(): void {
    const termino = this.terminoBusqueda.trim();

    if (termino.length === 0) {
      this.clientesEncontrados = [];
      return;
    }

    // Buscamos a partir de 1 carácter para que responda rápido al escribir números o letras
    this.service.buscarClientesFacturacion(termino).subscribe({
      next: (data) => (this.clientesEncontrados = data),
      error: (err) => console.error('Error en buscador:', err),
    });
  }

  seleccionarCliente(cliente: ClienteFacturacion): void {
    this.clienteActual = { ...cliente };
    this.clientesEncontrados = [];
    this.terminoBusqueda = ''; // Limpiamos la barra al seleccionar
  }

  // VALIDACIONES ANTES DE GUARDAR
  guardarCliente(): void {
    // 1. Campos obligatorios vacíos
    if (
      !this.clienteActual.rfc ||
      !this.clienteActual.razonSocial ||
      !this.clienteActual.codigoPostal ||
      !this.clienteActual.regimenFiscal
    ) {
      alert(
        '⚠️ Por favor, llena todos los campos obligatorios marcados con asterisco (*).',
      );
      return;
    }

    // 2. Validación de formato de RFC (México)
    const rfcRegex =
      /^([A-ZÑ&]{3,4}) ?(?:- ?)?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])) ?(?:- ?)?([A-Z\d]{2}[A\d])$/i;
    if (!rfcRegex.test(this.clienteActual.rfc.trim())) {
      alert(
        '❌ El formato del RFC es inválido. Recuerda que debe tener 12 o 13 caracteres oficiales.',
      );
      return;
    }

    // 3. Validación de Código Postal (5 dígitos numéricos)
    const cpRegex = /^\d{5}$/;
    if (!cpRegex.test(this.clienteActual.codigoPostal.trim())) {
      alert(
        '❌ El Código Postal debe estar compuesto por exactamente 5 números.',
      );
      return;
    }

    // 4. Validación de WhatsApp (Opcional, pero si se pone, debe tener 10 dígitos)
    if (this.clienteActual.telefono) {
      const telLimpio = this.clienteActual.telefono.replace(/\D/g, '');
      if (telLimpio.length !== 10) {
        alert(
          '❌ El número de WhatsApp debe tener exactamente 10 dígitos numéricos.',
        );
        return;
      }
      this.clienteActual.telefono = telLimpio; // Guardamos el número limpio sin guiones
    }

    // 5. Validación de Correo Electrónico (Opcional)
    if (this.clienteActual.email && this.clienteActual.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.clienteActual.email.trim())) {
        alert('❌ El formato del correo electrónico no es válido.');
        return;
      }

      this.clienteActual = this.clienteVacio();
      this.clientesEncontrados = [];
      this.terminoBusqueda = '';
    }

    // Pasó todas las validaciones -> Mandamos a Java
    this.service.guardarClienteFacturacion(this.clienteActual).subscribe({
      next: (clienteGuardado) => {
        alert('✨ ¡Datos fiscales guardados con éxito en CocoRanch!');
        this.clienteActual = clienteGuardado;
      },
      error: (err) =>
        alert(err.error?.message || 'Error al guardar el cliente.'),
    });
  }

  buscarTicket(): void {
    this.errorTicket = '';
    this.ordenEncontrada = null;
    if (!this.numeroTicketBuscado) return;

    this.service.obtenerOrdenParaFacturar(this.numeroTicketBuscado).subscribe({
      next: (orden) => (this.ordenEncontrada = orden),
      error: (err) => {
        this.errorTicket =
          err.error?.message ||
          'No se encontró el ticket o no ha sido pagado todavía.';
      },
    });
  }

  enviarPorWhatsApp(): void {
    if (!this.clienteActual.telefono || !this.ordenEncontrada) return;

    const mensaje = `¡Hola, ${this.clienteActual.razonSocial}! 🤠\n\nGracias por tu visita a *CocoRanch*. Tu factura correspondiente al ticket #${this.ordenEncontrada.id} por el monto de $${this.ordenEncontrada.subtotal} ha sido generada con éxito.\n\nSi tienes alguna duda, no dudes en responder este mensaje. ¡Te esperamos pronto!`;
    const url = `https://wa.me/52${this.clienteActual.telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  limpiarFormulario(): void {
    // 1. Reseteamos el cliente a su estado vacío original
    this.clienteActual = this.clienteVacio();

    // 2. Limpiamos la lista del buscador desplegable
    this.clientesEncontrados = [];

    // 3. Vaciamos el texto que escribió el cajero en la barra de búsqueda
    this.terminoBusqueda = '';
  }
}
