import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestauranteService } from '../../services/restaurante.service';
import { ClienteFacturacion, Orden } from '../../models/restaurante.models';
import { Component, OnInit } from '@angular/core';

// 1. Importaciones de pdfmake
import * as _pdfMake from 'pdfmake/build/pdfmake';
import * as _pdfFonts from 'pdfmake/build/vfs_fonts';
const pdfMake: any = _pdfMake;
const pdfFonts: any = _pdfFonts;

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

  // Cliente Activo (Variables unificadas)
  clienteActual: ClienteFacturacion = this.clienteVacio();

  // Buscador de Tickets (Variables unificadas)
  numeroTicketBuscado: number | null = null;
  ordenEncontrada: any = null; // Usamos any o tu modelo Orden si incluye 'detalles'
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

  // --- MÉTODOS DE BÚSQUEDA Y GUARDADO ---

  buscarCliente(): void {
    const termino = this.terminoBusqueda.trim();
    if (termino.length === 0) {
      this.clientesEncontrados = [];
      return;
    }
    this.service.buscarClientesFacturacion(termino).subscribe({
      next: (data) => (this.clientesEncontrados = data),
      error: (err) => console.error('Error en buscador:', err),
    });
  }

  seleccionarCliente(cliente: ClienteFacturacion): void {
    this.clienteActual = { ...cliente };
    this.clientesEncontrados = [];
    this.terminoBusqueda = '';
  }

  guardarCliente(): void {
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

    const rfcRegex =
      /^([A-ZÑ&]{3,4}) ?(?:- ?)?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])) ?(?:- ?)?([A-Z\d]{2}[A\d])$/i;
    if (!rfcRegex.test(this.clienteActual.rfc.trim())) {
      alert(
        '❌ El formato del RFC es inválido. Recuerda que debe tener 12 o 13 caracteres oficiales.',
      );
      return;
    }

    const cpRegex = /^\d{5}$/;
    if (!cpRegex.test(this.clienteActual.codigoPostal.trim())) {
      alert(
        '❌ El Código Postal debe estar compuesto por exactamente 5 números.',
      );
      return;
    }

    if (this.clienteActual.telefono) {
      const telLimpio = this.clienteActual.telefono.replace(/\D/g, '');
      if (telLimpio.length !== 10) {
        alert(
          '❌ El número de WhatsApp debe tener exactamente 10 dígitos numéricos.',
        );
        return;
      }
      this.clienteActual.telefono = telLimpio;
    }

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

  limpiarFormulario(): void {
    this.clienteActual = this.clienteVacio();
    this.clientesEncontrados = [];
    this.terminoBusqueda = '';
  }

  // --- MÉTODOS DE COMUNICACIÓN Y FACTURACIÓN ---

  enviarPorWhatsApp(): void {
    if (!this.clienteActual.telefono || !this.ordenEncontrada) return;

    const mensaje = `¡Hola, ${this.clienteActual.razonSocial}! 🤠\n\nGracias por tu visita a *CocoRanch*. Tu factura correspondiente al ticket #${this.ordenEncontrada.id} por el monto de $${this.ordenEncontrada.total || this.ordenEncontrada.subtotal} ha sido generada con éxito.\n\nSi tienes alguna duda, no dudes en responder este mensaje. ¡Te esperamos pronto!`;
    const url = `https://wa.me/52${this.clienteActual.telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  // MÉTODO CORREGIDO: Lógica dentro de las llaves
  generarFacturaPDF(): void {
    if (!this.ordenEncontrada) {
      alert('No hay una orden cargada para facturar.');
      return;
    }

    // 1. Armar las filas de la tabla de consumo
    const detallesBody = [];
    detallesBody.push([
      { text: 'CANT.', style: 'tableHeader' },
      { text: 'DESCRIPCIÓN', style: 'tableHeader' },
      { text: 'P. UNITARIO', style: 'tableHeader' },
      { text: 'IMPORTE', style: 'tableHeader' },
    ]);

    let subtotalCalculado = 0;

    if (
      this.ordenEncontrada.detalles &&
      this.ordenEncontrada.detalles.length > 0
    ) {
      this.ordenEncontrada.detalles.forEach((item: any) => {
        const importe = item.cantidad * item.precioUnitario;
        subtotalCalculado += importe;

        detallesBody.push([
          { text: item.cantidad.toString(), alignment: 'center' },
          item.producto ? item.producto.nombre : 'Platillo/Bebida',
          { text: `$${item.precioUnitario.toFixed(2)}`, alignment: 'right' },
          { text: `$${importe.toFixed(2)}`, alignment: 'right' },
        ]);
      });
    } else {
      // Fallback por si la orden no trae el desglose en el JSON
      subtotalCalculado = this.ordenEncontrada.subtotal || 0;
      detallesBody.push([
        { text: '1', alignment: 'center' },
        'Consumo de Alimentos y Bebidas',
        { text: `$${subtotalCalculado.toFixed(2)}`, alignment: 'right' },
        { text: `$${subtotalCalculado.toFixed(2)}`, alignment: 'right' },
      ]);
    }

    const iva = subtotalCalculado * 0.16;
    const total = subtotalCalculado + iva;

    // 2. Construir el documento
    const documentDefinition: any = {
      content: [
        // Cabecera
        {
          columns: [
            {
              text: 'COCORANCH SINALOA\nRFC: COCO123456789\nRegimen: 601 - General de Ley Personas Morales',
              style: 'header',
            },
            {
              text: `FACTURA\nTicket: #${this.ordenEncontrada.id}\nOrigen: ${this.ordenEncontrada.mesa ? 'Mesa ' + this.ordenEncontrada.mesa.numero : this.ordenEncontrada.clienteExterno || 'Pedido Externo'}\nFecha: ${new Date().toLocaleDateString()}`,
              alignment: 'right',
              style: 'subheader',
            },
          ],
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 15,
              x2: 515,
              y2: 15,
              lineWidth: 1,
              lineColor: '#cccccc',
            },
          ],
        },

        // Datos del receptor (Cliente)
        { text: 'RECEPTOR', style: 'sectionTitle', margin: [0, 25, 0, 5] },
        {
          columns: [
            {
              width: '50%',
              text: [
                { text: 'Razón Social: ', bold: true },
                `${this.clienteActual.razonSocial || 'Público en General'}\n`,
                { text: 'RFC: ', bold: true },
                `${this.clienteActual.rfc || 'XAXX010101000'}\n`,
                { text: 'Régimen Fiscal: ', bold: true },
                `${this.clienteActual.regimenFiscal || '616 - Sin obligaciones fiscales'}\n`,
              ],
            },
            {
              width: '50%',
              text: [
                { text: 'C.P.: ', bold: true },
                `${this.clienteActual.codigoPostal || '00000'}\n`,
                { text: 'Uso CFDI: ', bold: true },
                `G03 - Gastos en general\n`,
                { text: 'Método de Pago: ', bold: true },
                `PUE - Pago en una sola exhibición`,
              ],
              alignment: 'right',
            },
          ],
          margin: [0, 0, 0, 20],
        },

        // Tabla de Conceptos
        { text: 'CONCEPTOS', style: 'sectionTitle', margin: [0, 10, 0, 5] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto'],
            body: detallesBody,
          },
          layout: 'lightHorizontalLines',
        },

        // Sección de Totales
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 200,
              table: {
                widths: ['*', 'auto'],
                body: [
                  [
                    'Subtotal:',
                    {
                      text: `$${subtotalCalculado.toFixed(2)}`,
                      alignment: 'right',
                    },
                  ],
                  [
                    'IVA (16%):',
                    { text: `$${iva.toFixed(2)}`, alignment: 'right' },
                  ],
                  [
                    { text: 'TOTAL:', bold: true, fontSize: 14 },
                    {
                      text: `$${total.toFixed(2)}`,
                      bold: true,
                      fontSize: 14,
                      alignment: 'right',
                    },
                  ],
                ],
              },
              layout: 'noBorders',
              margin: [0, 20, 0, 0],
            },
          ],
        },

        // Sello y mensaje final
        {
          text: 'Este documento es una representación impresa de un CFDI.\n¡Gracias por su preferencia!',
          style: 'footer',
          alignment: 'center',
          margin: [0, 50, 0, 0],
        },
      ],
      styles: {
        header: { fontSize: 12, bold: true, color: '#333333' },
        subheader: { fontSize: 12, color: '#666666' },
        sectionTitle: { fontSize: 11, bold: true, color: '#D97706' }, // Naranja estilo CocoRanch
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'black',
          fillColor: '#f3f4f6',
          alignment: 'center',
        },
        footer: { fontSize: 9, italics: true, color: '#9ca3af' },
      },
      defaultStyle: { fontSize: 10 },
    };

    // 3. Generar y descargar el documento PDF
    pdfMake
      .createPdf(documentDefinition)
      .download(`Factura_CocoRanch_T${this.ordenEncontrada.id}.pdf`);
  }
}
