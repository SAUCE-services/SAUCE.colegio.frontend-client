import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  HistoriaFacturacionDto,
  LineaDetalleDto,
  ReporteRecaudacionDto,
  ReporteFacturaPeriodoDto,
  DeudaIndividualResponseDto,
  DeudaCursoResponseDto
} from '../models/colegio.models';

@Injectable({
  providedIn: 'root',
})
export class FacturaService {
  private http = inject(HttpClient);
  private baseUrl = '/api';

  // --- CUENTA CORRIENTE / DETALLE ---
  getCuentaCorriente(alumnoId: number): Observable<HistoriaFacturacionDto[]> {
    return this.http.get<HistoriaFacturacionDto[]>(`${this.baseUrl}/facturacion/historia/${alumnoId}`);
  }

  getDetalleFactura(id: number): Observable<LineaDetalleDto[]> {
    return this.http.get<LineaDetalleDto[]>(`${this.baseUrl}/facturacion/detalle/${id}`);
  }

  generarCuotasMensuales(periodoId: number): Observable<string> {
    return this.http.post(`${this.baseUrl}/factura/generar/${periodoId}`, {}, { responseType: 'text' });
  }

  // --- PAGOS ---
  registrarPago(dto: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/facturacion/registrar-pago`, dto);
  }

  anularPago(nroFactura: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/facturacion/anular-pago/${nroFactura}`, {});
  }

  buscarFacturaParaPago(alumnoId: number, periodo: string) {
    return this.http.get(`${this.baseUrl}/facturacion/buscar-para-pago`, {
      params: { alumnoId: alumnoId.toString(), periodo: periodo }
    });
  }

  // --- FACTURAR POR CURSO ---
  // 🌟 Vista previa: todos los alumnos del curso, marcados como facturado/pendiente
  previewFacturaCurso(cursoId: number, periodoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/facturacion/preview-curso`, {
      params: { cursoId: cursoId.toString(), periodoId: periodoId.toString() }
    });
  }

  // 🌟 PDF de "Facturar por Curso": una página por cada alumno ya facturado en el período
  imprimirFacturaCurso(cursoId: number, periodoId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/facturacion/imprimir-curso`, {
      params: { cursoId: cursoId.toString(), periodoId: periodoId.toString() },
      responseType: 'blob'
    });
  }

  // 🌟 Agrupa las novedades pendientes de cada alumno del curso en una factura nueva,
  // para el período y vencimiento indicados.
  facturarCurso(dto: { cursoId: number; periodoId: number; fechaVencimiento: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/facturacion/facturar-curso`, dto);
  }

  // --- FACTURAR POR ALUMNO ---
  // 🌟 Vista previa de un solo alumno (mismo formato que la de curso)
  previewFacturaAlumno(alumnoId: number, periodoId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/facturacion/preview-alumno`, {
      params: { alumnoId: alumnoId.toString(), periodoId: periodoId.toString() }
    });
  }

  // 🌟 Agrupa los conceptos pendientes de un alumno en una factura nueva, con recargo opcional
  facturarAlumno(dto: { alumnoId: number; periodoId: number; fechaVencimiento: string; recargo?: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/facturacion/facturar-alumno`, dto);
  }

  // 🌟 PDF de "Factura por Alumno" (dos copias, misma plantilla que "Factura por Curso")
  imprimirFacturaAlumno(alumnoId: number, periodoId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/facturacion/imprimir-alumno`, {
      params: { alumnoId: alumnoId.toString(), periodoId: periodoId.toString() },
      responseType: 'blob'
    });
  }

  // --- FACTURAS/RECAUDACIÓN POR PERÍODO Y POR FECHAS ---
  getFacturasPorPeriodo(periodo: string): Observable<ReporteFacturaPeriodoDto> {
    return this.http.get<ReporteFacturaPeriodoDto>(`${this.baseUrl}/facturacion/facturas-periodo`, {
      params: { periodo }
    });
  }

  descargarPdfFacturasPeriodo(periodo: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/facturacion/facturas-periodo-pdf`, {
      params: { periodo },
      responseType: 'blob'
    });
  }

  getRecaudacionPorPeriodo(periodo: string): Observable<ReporteRecaudacionDto> {
    return this.http.get<ReporteRecaudacionDto>(`${this.baseUrl}/facturacion/recaudacion-periodo`, {
      params: { periodo }
    });
  }

  descargarPdfRecaudacionPeriodo(periodo: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/facturacion/recaudacion-periodo-pdf`, {
      params: { periodo },
      responseType: 'blob'
    });
  }

  getRecaudacionPorFechas(desde: string, hasta: string): Observable<ReporteRecaudacionDto> {
    return this.http.get<ReporteRecaudacionDto>(`${this.baseUrl}/facturacion/recaudacion-fechas`, {
      params: { desde, hasta } // ISO format yyyy-mm-dd
    });
  }

  descargarPdfRecaudacionFechas(desde: string, hasta: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/facturacion/recaudacion-fechas-pdf`, {
      params: { desde, hasta },
      responseType: 'blob'
    });
  }

  getRecaudacionDiaria(fecha: string): Observable<ReporteRecaudacionDto> {
    // El back espera dd-mm-yyyy
    return this.http.get<ReporteRecaudacionDto>(`${this.baseUrl}/facturacion/recaudacion-diaria`, {
      params: { fecha }
    });
  }

  descargarPdfRecaudacion(fecha: string): Observable<Blob> {
    // El back espera formato ISO (yyyy-mm-dd) para el PDF según el controlador
    const fechaIso = fecha.split('-').reverse().join('-');
    return this.http.get(`${this.baseUrl}/facturacion/recaudacion-diaria-pdf`, {
      params: { fecha: fechaIso },
      responseType: 'blob'
    });
  }

  // --- DEUDA ---
  getDeudaIndividual(alumnoId: number): Observable<DeudaIndividualResponseDto> {
    return this.http.get<DeudaIndividualResponseDto>(`${this.baseUrl}/facturacion/alumno/${alumnoId}/deuda-individual`);
  }

  descargarPdfDeudaIndividual(alumnoId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/facturacion/alumno/${alumnoId}/deuda-individual-pdf`, {
      responseType: 'blob'
    });
  }

  getDeudaPorCurso(nombreCurso: string): Observable<DeudaCursoResponseDto> {
    return this.http.get<DeudaCursoResponseDto>(`${this.baseUrl}/curso/deuda`, {
      params: { cursoNombre: nombreCurso }
    });
  }

  descargarPdfDeudaCurso(nombreCurso: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/curso/deuda/pdf`, {
      params: { cursoNombre: nombreCurso },
      responseType: 'blob'
    });
  }

  getDeudaGeneral(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/facturacion/reportes/deuda-general`);
  }

  descargarPdfDeudaGeneral(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/facturacion/reportes/deuda-general-pdf`, {
      responseType: 'blob'
    });
  }

   // 🌟 Anula la factura completa (distinto de anularPago, que solo revierte el pago)
  anularFactura(nroFactura: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/facturacion/anular-factura/${nroFactura}`, {});
  }
}