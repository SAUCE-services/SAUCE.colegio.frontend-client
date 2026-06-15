export interface AlumnoDto {
  alumnoId: number;
  nombreCompleto: string;
}

export interface CursoDetalleResponse {
  nombreCurso: string;
  nombreMaestro: string;
  nombreEstablecimiento: string;
  nombreTurno: string;
  nombreCiclo: string;
  alumnos: AlumnoDto[];
}

// AGREGÁ ESTO PARA LA HOME:
export interface CursoDto {
  cursoId: number;
  descripcion: string;
  nombreMaestro: string;
  nombreTurno: string;
  nombreEstablecimiento: string;
  nombreCiclo: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // Página actual
}

export interface PeriodoDto{
  periodoId: number;
  descripcion: String;
  nombreCiclo:String;
  mes:Date;
  fechaSegundo:Date;
}

export interface ConceptoDto{
  conceptoId: number;
  descripcion: String;
  importe:number;
}

export interface AlumnoCompletoDto {
  alumnoId?: number;
  apellido: string;
  nombre: string;
  curso: string;
  nroDocumento: string;
  tipoDocumentoId: number;
  nacionalidadId: number;
  transporteId: number;
  fechaNacimiento: string;
  fechaIngreso: string;

  // Datos del Padre
  apellidoPadre: string;
  nombrePadre: string;
  nroDocumentoPadre: number;
  tipoDocumentoPadreId: number;
  callePadre: string;
  nroPadre: string;
  deptoPadre:String;
  pisoPadre:String;
  telCelPadre: string;
  nivelEstudioPadreId: number;
  localidadPadreId: number;
  actividadPadreId: number;
  parentescoPadreId: number;
  presentePadre: boolean;
  departamentoPadreId:number;

  // Datos de la Madre
  apellidoMadre: string;
  nombreMadre: string;
  nroDocumentoMadre: number;
  tipoDocumentoMadreId: number;
  calleMadre: string;
  nroMadre: string;
  deptoMadre:String;
  pisoMadre:String;
  telCelMadre: string;
  nivelEstudioMadreId: number;
  localidadMadreId: number;
  actividadMadreId: number;
  parentescoMadreId: number;
  presenteMadre: boolean;
  departamentoMadreId:number;


  // Datos de Salud
  enfermedades: string;
  padeceEnfermedad: boolean;
  tomaMedicamentos: string;
  medicamentosAlergia: string;
  grupoSanguineoId: number;
  obraSocialId: number;
  telEmergencia1: string;
  telEmergencia2: string;
}

export interface ComboItem {
  id: number;
  nombre: string;
}

export interface Anotador {
  anotadorId?: number;
  alumnoId: number;
  fecha?: string; // Viene como Timestamp desde Java
  anotacion: string;
  transaccionId: number;
}

// app/models/colegio.models.ts

export interface HistoriaFacturacionDto {
  legajo: number;
  nombreCompleto: string;
  facturas: FacturaDetalleDto[]; // Tu back devuelve una lista de facturas
}

export interface FacturaDetalleDto {
  nroFactura: number;
  estado: string;
  fechaEstado: string;
  primerVenc: string;
  fechaPago: string;
  impAdeudado: number; // Esto es el "Debe"
  impPagado: number;   // Esto es el "Haber"
  fechaCanc: string;
  periodo: string;
  saldoProgresivo?: number; // <--- Propiedad calculada para la vista
  detalles?: LineaDetalleDto[]; // <--- Aquí guardaremos el detalle al expandir
  isExpanded?: boolean;      // <--- Para controlar la visualización
}

export interface LineaDetalleDto {
  fechaEstado: string;
  concepto: string;
  estado: string;
  importe: number;
  fechaRegistro: string;
  periodo: string;
}

export interface ReporteRecaudacionDto {
  fechaReporte: string; // El back envía LocalDate
  establecimientos: RecaudacionEstablecimientoDto[];
  granTotal: number; // BigDecimal en Java
}

export interface RecaudacionEstablecimientoDto {
  nombre: string;
  medios: RecaudacionMedioDto[];
  totalEstablecimiento: number;
}

export interface RecaudacionMedioDto {
  nombre: string;
  items: RecaudacionDetalleDto[];
  cantidadPagos: number; // int en Java
  subtotal: number;
}

export interface RecaudacionDetalleDto {
  factura: number;
  periodo: string;
  legajo: number; 
  nombre: string;
  pagado: number;
}

export interface FacturaPeriodoDetalleDto{
  factura: number;
  periodo: string;
  legajo: number; 
  nombre: string;
  facturado: number;
}
export interface FacturaPeriodoEstablecimientoDto{
  nombre: string;
  items: RecaudacionDetalleDto[];
  legajo: number; 
  cantidadFacturas: number;
  totalEstablecimiento: number;
}

export interface ReporteFacturaPeriodoDto{
  descripcionPeriodo: string;
  fechaGeneracion: string;
  establecimientos: FacturaPeriodoEstablecimientoDto[];
  granTotal: number; 
  cantidadTotalFacturas: number;
}

export interface ReporteRecaudacionDto {
  fechaReporte: string;
  establecimientos: RecaudacionEstablecimientoDto[];
  granTotal: number;
}

export interface RecaudacionEstablecimientoDto {
  nombre: string;
  medios: RecaudacionMedioDto[];
  totalEstablecimiento: number;
}

export interface RecaudacionMedioDto {
  nombre: string;
  items: RecaudacionDetalleDto[];
  cantidadPagos: number;
  subtotal: number;
}

export interface RecaudacionDetalleDto {
  factura: number;
  periodo: string;
  legajo: number;
  nombre: string;
  pagado: number;
}

export interface RecaudacionDetalleDto {
  factura: number;
  periodo: string;
  legajo: number;
  nombre: string;
  fecha: string; // Asegurar que este campo esté presente para el reporte por fechas
  pagado: number;
}

export interface DeudaIndividualResponseDto {
  detalles: LineaDetalleDto[];
  totalDeuda: number;
}

export interface DeudaCursoDetalleDto {
  alumnoId: number;
  nombreCompleto: string;
  fechaUltimoMovimiento: string; // Formato fecha ISO o string
  totalDeuda: number;
}

export interface DeudaCursoResponseDto {
  nombreCurso: string;
  nombreCiclo: string;
  totalDeudaCurso: number;
  detalles: DeudaCursoDetalleDto[];
}

// src/app/models/colegio.models.ts

export interface NovedadCargaDto {
  conceptoId?: number;
  nombreConcepto: string;
  periodoId?: number;
  nombrePeriodo: string;
  fechaRegistro: string;
  importe: number;
  procesado: boolean;
}

export interface NovedadesAlumnoResponseDto {
  alumnoId: number;
  nombreCompleto: string;
  novedades: NovedadCargaDto[];
}

export interface NovedadCargaDto {
  alumnoId: number;
  periodoNombre: string;
  conceptoId? : number;
  importe : number;
}

export interface NovedadCursoDto {
  legajo: number;
  alumno: string;
  curso: string;
  concepto: string;
  importe : number;
  estado : string;
  fecha : Date;
}