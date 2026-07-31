import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageResponse, MaestroDto } from '../models/colegio.models';

@Injectable({
  providedIn: 'root',
})
export class MaestroService {
  private http = inject(HttpClient);
  private baseUrl = '/api';

  listarMaestros(page: number = 0, size: number = 15): Observable<PageResponse<MaestroDto>> {
    return this.http.get<PageResponse<MaestroDto>>(`${this.baseUrl}/maestro/paginado`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  guardarMaestro(maestro: Partial<MaestroDto>): Observable<any> {
    return this.http.post(`${this.baseUrl}/maestro/`, maestro);
  }

  actualizarMaestro(id: number, maestro: Partial<MaestroDto>): Observable<any> {
    return this.http.put(`${this.baseUrl}/maestro/${id}`, maestro);
  }
}