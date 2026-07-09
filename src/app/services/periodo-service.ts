import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse, PeriodoDto } from '../models/colegio.models';

@Injectable({
  providedIn: 'root',
})
export class PeriodoService {
  private http = inject(HttpClient);
  private baseUrl = '/api';

  listarPeriodos(page: number = 0, size: number = 15): Observable<PageResponse<PeriodoDto>> {
    return this.http.get<PageResponse<PeriodoDto>>(`${this.baseUrl}/periodo/paginado`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  // 🌟 Combo sin paginar de periodos de un ciclo (para el <select> de "Facturar por Curso")
  getPeriodosComboPorCiclo(ciclo: string): Observable<PeriodoDto[]> {
    return this.http.get<PeriodoDto[]>(`${this.baseUrl}/periodo/combo`, { params: { ciclo } });
  }

  buscarPeriodos(primerVenc?: string, segundoVenc?: string, ciclo?: string, page: number = 0): Observable<PageResponse<PeriodoDto>> {
    let params: any = { page: page.toString(), size: '15' };

    const formatearFecha = (fecha: string) => {
      if (!fecha || !fecha.includes('-')) return fecha;
      const parts = fecha.split('-');
      if (parts.length !== 3) return fecha;
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    if (primerVenc) params.primerVenc = formatearFecha(primerVenc);
    if (segundoVenc) params.segundoVenc = formatearFecha(segundoVenc);
    if (ciclo) params.ciclo = ciclo;

    return this.http.get<PageResponse<PeriodoDto>>(`${this.baseUrl}/periodo/buscar`, { params });
  }

  guardarPeriodo(periodo: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/periodo/`, periodo);
  }

  getPeriodosHistoricos(): Observable<any> {
    // Pedimos un tamaño grande (size=100) para traer todos los periodos de la base de datos de una sola vez
    return this.http.get(`${this.baseUrl}/periodo/paginado?size=100`);
  }
}