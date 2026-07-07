export interface Mesa {
  id: number;
  numero: string;
  estado: 'LIBRE' | 'OCUPADA' | 'RESERVADA';
}

export interface Producto {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number | null;
  activo?: boolean;
  categoriaId?: number;
  categoriaNombre?: string;
}

export interface OrdenDetalle {
  id?: number;
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  notas: string;
  subtotal?: number;
  enviadoCocina?: boolean;
}

export interface Orden {
  id: number;
  mesa: Mesa;
  estado: string;
  subtotal: number;
  total: number;
  detalles: OrdenDetalle[];
}

export interface ClienteFacturacion {
  id?: number;
  rfc: string;
  razonSocial: string;
  codigoPostal: string;
  regimenFiscal: string;
  telefono?: string;
  email?: string;
}
