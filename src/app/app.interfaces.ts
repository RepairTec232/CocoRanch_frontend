export interface SearchOption {
  label: string;
  value: string;
}

export interface Notification {
  text: string;
  icon: string;
  type: string;
  title: string;
  date: Date;
}

export interface AditionalUserData {
  displayName: string | null;
  givenName: string | null;
  surname: string | null;
  employeeId: string | null;
  mail: string | null;
  jobTitle: string | null;
  department: string | null;
  companyName: string | null;
  email: string | null;
}

export interface SidebarMenuItem {
  title: string;
  icon?: string;
  items?: SidebarMenuItem[];
  to?: string;
}

export interface Cliente {
  id?: number; // Opcional porque al crear uno nuevo no tenemos ID aún
  nombreCompleto: string;
  telefono: string;
  email?: string;
}

export interface Equipo {
  id?: number;
  cliente?: { id: number }; // Solo necesitamos el ID del cliente para el POST
  tipo: string;
  marca: string;
  modelo: string;
  numeroSerie?: string;
}

// 🚀 UNIFICADO: Una sola interfaz OrdenRespuesta limpia, completa y alineada a OrdenRespuestaDTO de Java
export interface OrdenRespuesta {
  id: number; 
  fechaIngreso: string; // Sincronizado como String para procesar el formato ISO del backend
  nombreCliente: string;
  telefonoCliente: string;
  equipoDetalle: string;
  fallaReportada: string;
  estado: string;
  diagnosticoTecnico?: string; // Opcional para cuando se está revisando
  costoTotal?: number;
  folio?: string | number;
  costoEstimado?: number;
  anticipo?: number;
}

// Este lo usaremos para enviar el POST de una nueva orden
export interface OrdenCreacion {
  equipo: { id: number };
  fallaReportada: string;
}

export interface Reparacion {
  id?: number;
  folio?: string; 
  fecha_ingreso: string; 
  falla_reported: string; 
  estado: string;
  diagnostico_tecnico?: string;
  costo_total?: number;

  // Datos del equipo y cliente que necesitas pintar en la tabla
  equipo?: {
    id: number;
    tipo: string;
    marca: string;
    modelo: string;
    numero_serie: string;
  };
  clienteNombre?: string; 
  clienteTelefono?: string;
}

export interface Refaccion {
  id?: number;
  marca: string;
  modelo: string;
  tipoFalla: string;
  calidad: string;
  costoPieza: number;
  costoVuelta?: number;
  ganancia: number;
  precioTotalCliente?: number;
}

export interface MovimientoCaja {
  id?: number;
  tipo: 'INGRESO' | 'EGRESO';
  descripcion: string;
  monto: number;
  fechaHora?: string;
}

export interface CorteCaja {
  id?: number;
  fechaCorte?: string;
  totalIngresos: number;
  totalEgresos: number;
  saldoFinal: number;
  observaciones?: string;
}

export interface DashboardStats {
  gananciasMes: number;
  totalPendientes: number;
  totalEnRevision: number;
  totalEntregados: number;
}