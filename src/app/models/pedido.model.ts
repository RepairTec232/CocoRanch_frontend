export interface PedidoExterno {
  id?: number;
  fecha: Date;
  cliente: string;
  telefono: string;
  pedido: string;
  detallePedido: string;
  detalle?: string;
  tipo: 'Para llevar' | 'Para recoger' | 'En espera';
  estatus: 'Pendiente' | 'Listo' | 'Entregado';
}