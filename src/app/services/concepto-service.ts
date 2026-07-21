import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConceptoDto, PageResponse, NovedadCargaDto, NovedadCursoDto } from '../models/colegio.models';

@Injectable({
  providedIn: 'root',
})
export class ConceptoService {
  private http = inject(HttpClient);
  private baseUrl = '/api';

  // --- CONCEPTOS ---
  listarConceptos(page: number = 0, size: number = 15): Observable<PageResponse<ConceptoDto>> {
    return this.http.get<PageResponse<ConceptoDto>>(`${this.baseUrl}/concepto/paginado`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  guardarConcepto(concepto: Partial<ConceptoDto>): Observable<ConceptoDto> {
    return this.http.post<ConceptoDto>(`${this.baseUrl}/concepto/`, concepto);
  }

  actualizarConcepto(id: number, dto: ConceptoDto): Observable<ConceptoDto> {
    return this.http.put<ConceptoDto>(`${this.baseUrl}/concepto/${id}`, dto);
  }

  descargarPdfTodosLosConceptos(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/concepto/pdf`, {
      responseType: 'blob'
    });
  }

  getConceptosCombo(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/combos/conceptos`);
  }

  // --- NOVEDADES (cargos por alumno / por curso) ---
  getNovedadesPorAlumno(alumnoId: number, periodoNombre: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/concepto/novedades/alumno/${alumnoId}?periodoNombre=${periodoNombre}`);
  }

  agregarNovedadManual(dto: { alumnoId: number; periodoNombre: string; conceptoId: number; importe: number }): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/concepto/novedades/agregar`, dto);
  }

  eliminarNovedadIndividual(alumnoId: number, conceptoId: number, periodoNombre: string, importe: number): Observable<void> {
    const payload = {
      alumnoId: Number(alumnoId),
      periodoNombre: periodoNombre.trim(),
      periodo: periodoNombre.trim(), // Fallback rústico por si las moscas
      conceptoId: Number(conceptoId),
      importe: Number(importe)
    };
    // En Angular, para pasar un BODY en un DELETE se usa la propiedad 'body' dentro de las opciones;
    // acá se usa post() directo porque el back expone /novedades/anular como POST.
    return this.http.post<void>(`${this.baseUrl}/concepto/novedades/anular`, payload);
  }

  // Obtener novedades cargadas por curso (para ver qué se aplicó)
  getNovedadesPorCurso(cursoId: number, periodo: string, ciclo: string): Observable<NovedadCursoDto[]> {
    const params = { cursoId: cursoId.toString(), periodo, ciclo };
    return this.http.get<NovedadCursoDto[]>(`${this.baseUrl}/concepto/novedades/curso/${cursoId}`, { params });
  }

  // Grabar novedad masiva por curso
  guardarNovedadCurso(cursoId: number, novedadCurso: NovedadCargaDto): Observable<void> {
    const params = { ciclo: (novedadCurso as any).ciclo || '' };
    return this.http.post<void>(`${this.baseUrl}/concepto/novedades/curso/${cursoId}/agregar-todos`, novedadCurso, { params });
  }

  // Eliminar novedades en bloque de un curso
  eliminarNovedadCurso(cursoId: number, payload: any): Observable<void> {
    const params = {
      periodoNombre: payload.periodoNombre,
      ciclo: payload.ciclo
    };
    return this.http.post<void>(`${this.baseUrl}/concepto/novedades/curso/${cursoId}/anular-todos`, null, { params });
  }
}