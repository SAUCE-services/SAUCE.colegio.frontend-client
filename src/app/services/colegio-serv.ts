import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  CursoDetalleResponse, 
  CursoDto, 
  PageResponse, 
  AlumnoCompletoDto, 
  ComboItem, 
  Anotador,
  AlumnoDto
} from '../models/colegio.models';

@Injectable({
  providedIn: 'root',
})
export class ColegioServ {
  getRecaudacionDiaria(fechaFormateada: string) {
    throw new Error('Method not implemented.');
  }
  descargarPdfRecaudacion(fechaFormateada: string) {
    throw new Error('Method not implemented.');
  }
  getPeriodosHistoricos() {
    throw new Error('Method not implemented.');
  }
  getCuentaCorriente // --- MÓDULO: COMBOS (Para formularios de Alumno/Padres) ---
    (legajo: number) {
      throw new Error('Method not implemented.');
  }
  getDetalleFactura(nroFactura: any) {
    throw new Error('Method not implemented.');
  }
  registrarPago(payload: { legajo: number; nroFactura: number; fechaPago: string; importePagado: number; tipoPagoId: number; }) {
    throw new Error('Method not implemented.');
  }
  anularPago(nroFactura: number) {
    throw new Error('Method not implemented.');
  }
  private http = inject(HttpClient);
  
  // Base URL centralizada para evitar repeticiones
  private baseUrl = '/api';

  // --- MÓDULO: ALUMNOS ---
  // Obtiene alumnos de un curso específico para la grilla
  getAlumnosPorCurso(nombre: string): Observable<CursoDetalleResponse> {
    return this.http.get<CursoDetalleResponse>(`${this.baseUrl}/alumno/curso`, {
      params: { nombre: nombre } 
    });
  }

  getAlumnoPorLegajo(legajo: number) {
    // Asegúrate de que esta ruta coincida con tu AlumnoController
    return this.http.get(`${this.baseUrl}/alumno/${legajo}`);
  }

  descargarPdfAlumnosPorCurso(nombreCurso: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/alumno/curso-pdf`, {
      params: { nombre: nombreCurso },
      responseType: 'blob' // 👈 Clave para indicarle a Angular que viajan bytes puros
    });
  }

  // Guarda la ficha completa de inscripción (Alumno, Padres, Salud)
  guardarAlumnoCompleto(dto: AlumnoCompletoDto): Observable<string> {
    return this.http.post(`${this.baseUrl}/alumno/completo`, dto, { 
      responseType: 'text' 
    });
  }

  getAlumnoPorId(id: number): Observable<AlumnoCompletoDto> {
    return this.http.get<AlumnoCompletoDto>(`${this.baseUrl}/alumno/${id}`);
  }

  // 🌟 CORREGIDO: Consulta alumnos usando tu filtro real por curso (pasamos "" para traer los libres)
  getAlumnosPorCursoFiltro(cursoNombre: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/alumno/filtrar-por-curso?cursoNombre=${encodeURIComponent(cursoNombre)}`);
  }

  // 🌟 CORREGIDO: POST oficial para el botón (+) 
  asignarAlumnoACurso(alumnoId: number, cursoNombre: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/alumno/${alumnoId}/asignar?cursoNombre=${encodeURIComponent(cursoNombre)}`, {});
  }

  // 🌟 CORREGIDO: POST oficial para el botón (-)
  quitarAlumnoDeCurso(alumnoId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/alumno/${alumnoId}/quitar`, {});
  }

  // Búsqueda de alumnos por nombre/apellido (autocompletado)
  buscarAlumnos(query: string): Observable<AlumnoDto[]> {
    return this.http.get<AlumnoDto[]>(`${this.baseUrl}/alumno/buscar?query=${query}`);
  }

  // --- MÓDULO: CURSOS ---
  listarCursos(page: number = 0, size: number = 10): Observable<PageResponse<CursoDto>> {
    return this.http.get<PageResponse<CursoDto>>(`${this.baseUrl}/curso/`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  // Registra o modifica una división/curso en el servidor (POST)
  guardarOModificarCurso(cursoCarga: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/curso/guardar`, cursoCarga);
  }

  filtrarCursosPorCiclo(anio: string, page: number = 0, size: number = 10): Observable<PageResponse<CursoDto>> {
    return this.http.get<PageResponse<CursoDto>>(`${this.baseUrl}/curso/ciclo/${anio}`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  // 🌟 Paginación separada por tipo de establecimiento (jardin/colegio), con filtro opcional de ciclo
  listarCursosPorTipo(tipo: 'jardin' | 'colegio', anio: string | undefined, page: number = 0, size: number = 10): Observable<PageResponse<CursoDto>> {
    const params: any = { page: page.toString(), size: size.toString() };
    if (anio) params.anio = anio;
    return this.http.get<PageResponse<CursoDto>>(`${this.baseUrl}/curso/tipo/${tipo}`, { params });
  }

  getCiclosDisponibles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/curso/ciclos-disponibles`);
  }

  // 🌟 Combo sin paginar de cursos de un ciclo (para el <select> de "Facturar por Curso")
  getCursosComboPorCiclo(ciclo: string): Observable<CursoDto[]> {
    return this.http.get<CursoDto[]>(`${this.baseUrl}/curso/combo`, { params: { ciclo } });
  }

  // --- MÓDULO: COMBOS (Para formularios de Alumno/Padres) ---
  getTiposDocumento(): Observable<any[]> { 
    return this.http.get<any[]>(`${this.baseUrl}/combos/documentos`); 
  }
  
  getNacionalidades(): Observable<any[]> { 
    return this.http.get<any[]>(`${this.baseUrl}/combos/nacionalidades`); 
  }
  
  getTransportes(): Observable<ComboItem[]> { 
    return this.http.get<ComboItem[]>(`${this.baseUrl}/combos/transportes`); 
  }
  
  getNivelesEstudio(): Observable<any[]> { 
    return this.http.get<any[]>(`${this.baseUrl}/combos/niveles-estudio`); 
  }
  
  getLocalidades(): Observable<ComboItem[]> { 
    return this.http.get<ComboItem[]>(`${this.baseUrl}/combos/localidades`); 
  }
  
  getObrasSociales(): Observable<any[]> { 
    return this.http.get<any[]>(`${this.baseUrl}/combos/obras-sociales`); 
  }
  
  getGruposSanguineos(): Observable<any[]> { 
    return this.http.get<any[]>(`${this.baseUrl}/combos/grupos-sanguineos`); 
  }

  getParentescos(): Observable<any[]> { 
    return this.http.get<any[]>(`${this.baseUrl}/combos/parentescos`); 
  }

  getActividades(): Observable<any[]> { 
    return this.http.get<any[]>(`${this.baseUrl}/combos/actividades`); 
  }

  getDepartamentos(): Observable<ComboItem[]> { 
    return this.http.get<ComboItem[]>(`${this.baseUrl}/combos/departamentos`); 
  }

  getTurnosCombo(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/combos/turnos`);
  }

  getMaestrosCombo(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/combos/maestros`);
  }

  getEstablecimientosCombo(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/combos/establecimientos`);
  }

  getCiclosComboEntidades(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/combos/ciclos`);
  }

  // --- MÓDULO: ANOTADOR ---
  // Obtiene todas las anotaciones del sistema (GET /anotador/)
  getTodasLasAnotaciones(): Observable<Anotador[]> {
    return this.http.get<Anotador[]>(`${this.baseUrl}/anotador/`);
  }

  // Obtiene anotaciones de un alumno específico (GET /anotador/alumno/{id})
  getAnotacionesPorAlumno(alumnoId: number): Observable<Anotador[]> {
    return this.http.get<Anotador[]>(`${this.baseUrl}/anotador/alumno/${alumnoId}`);
  }

  // Agrega una nota mediante POST (POST /anotador/)
  agregarAnotacion(anotador: Anotador): Observable<Anotador> {
    return this.http.post<Anotador>(`${this.baseUrl}/anotador/`, anotador);
  }

  // --- MÓDULO: CICLOS LECTIVOS ---
  // Lista todos los ciclos lectivos registrados en la BD
  listarCiclosLectivosCompletos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ciclos-lectivos`);
  }

  // 🌟 Único endpoint POST que guarda o actualiza según si viaja el cicloId
  guardarOCorregirCicloLectivo(ciclo: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/ciclos-lectivos/guardar`, ciclo);
  }
}