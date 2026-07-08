import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  ConceptoDto, 
  CursoDetalleResponse, 
  CursoDto, 
  PageResponse, 
  PeriodoDto, 
  AlumnoCompletoDto, 
  ComboItem, 
  Anotador,
  FacturaDetalleDto,
  HistoriaFacturacionDto,
  LineaDetalleDto,
  ReporteRecaudacionDto,
  ReporteFacturaPeriodoDto,
  DeudaIndividualResponseDto,
  DeudaCursoResponseDto,
  NovedadesAlumnoResponseDto,
  NovedadCargaDto,
  NovedadCursoDto,
  AlumnoDto
} from '../models/colegio.models';

@Injectable({
  providedIn: 'root',
})
export class ColegioServ {
  findNovedadesPorCursoYPeriodo(arg0: number, periodoSeleccionadoDescripcion: string, cicloSeleccionadoNombre: string) {
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

  // --- MÓDULO: PERÍODOS ---
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
  if (ciclo) params.ciclo = ciclo; // ✅ Agregamos el nuevo parámetro

  return this.http.get<PageResponse<PeriodoDto>>(`${this.baseUrl}/periodo/buscar`, { params });
}

// Registra un nuevo período contable de facturación (POST)
  guardarPeriodo(periodo: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/periodo/`, periodo);
  }

  // --- MÓDULO: CONCEPTOS ---
  listarConceptos(page: number = 0, size: number = 15): Observable<PageResponse<ConceptoDto>> {
    return this.http.get<PageResponse<ConceptoDto>>(`${this.baseUrl}/concepto/paginado`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  guardarConcepto(concepto: Partial<ConceptoDto>): Observable<ConceptoDto> {
    return this.http.post<ConceptoDto>(`${this.baseUrl}/concepto/`, concepto);
  }

  // 🌟 NUEVO MÉTODO: Actualiza un concepto educativo existente
  actualizarConcepto(id: number, dto: ConceptoDto): Observable<ConceptoDto> {
    return this.http.put<ConceptoDto>(`${this.baseUrl}/concepto/${id}`, dto);
  }

  // 🌟 NUEVO MÉTODO: Descarga el listado general en formato PDF
  descargarPdfTodosLosConceptos(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/concepto/pdf`, {
      responseType: 'blob' // 👈 Clave para que devuelva bytes puros
    });
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

  getAlumnoPorId(id: number): Observable<AlumnoCompletoDto> {
    return this.http.get<AlumnoCompletoDto>(`${this.baseUrl}/alumno/${id}`);
  }
  
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
getCuentaCorriente(alumnoId: number): Observable<HistoriaFacturacionDto[]> {
  return this.http.get<HistoriaFacturacionDto[]>(`${this.baseUrl}/facturacion/historia/${alumnoId}`);
}

getDetalleFactura(id: number): Observable<LineaDetalleDto[]> {
  return this.http.get<LineaDetalleDto[]>(`${this.baseUrl}/facturacion/detalle/${id}`);
}
generarCuotasMensuales(periodoId: number): Observable<string> {
  return this.http.post(`${this.baseUrl}/factura/generar/${periodoId}`, {}, { responseType: 'text' });
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

getDeudaIndividual(alumnoId: number): Observable<DeudaIndividualResponseDto> {
    return this.http.get<DeudaIndividualResponseDto>(`${this.baseUrl}/facturacion/alumno/${alumnoId}/deuda-individual`);
  }

  descargarPdfDeudaIndividual(alumnoId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/facturacion/alumno/${alumnoId}/deuda-individual-pdf`, {
      responseType: 'blob'
    });
  }
getDeudaPorCurso(nombreCurso: string): Observable<DeudaCursoResponseDto> {
  // Pasamos el parámetro de consulta tal como lo espera @RequestParam String cursoNombre en Java
  return this.http.get<DeudaCursoResponseDto>(`${this.baseUrl}/curso/deuda`, {
    params: { cursoNombre: nombreCurso }
  });
}

descargarPdfDeudaCurso(nombreCurso: string): Observable<Blob> {
  // Pasamos el parámetro de consulta y configuramos el responseType como blob para el binario iText
  return this.http.get(`${this.baseUrl}/curso/deuda/pdf`, {
    params: { cursoNombre: nombreCurso },
    responseType: 'blob'
  });
}

getNovedadesPorAlumno(alumnoId: number, periodoNombre: string): Observable<any> {
  // 🌟 Le pega exacto a tu mapeo de Spring Boot
  return this.http.get(`${this.baseUrl}/concepto/novedades/alumno/${alumnoId}?periodoNombre=${periodoNombre}`);
}

getPeriodosHistoricos(): Observable<any> {
  // Pedimos un tamaño grande (size=100) para traer todos los periodos de la base de datos de una sola vez
  return this.http.get(`${this.baseUrl}/periodo/paginado?size=100`);
}

getConceptosCombo(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/combos/conceptos`);
}

// 🌟 Envía el POST real a tu @PostMapping("/novedades/agregar")
agregarNovedadManual(dto: { alumnoId: number; periodoNombre: string; conceptoId: number; importe: number }): Observable<any[]> {
  return this.http.post<any[]>(`${this.baseUrl}/concepto/novedades/agregar`, dto);

}
// 3. Eliminar novedad individual (Sincronizado con el RequestBody del Back)
  eliminarNovedadIndividual(alumnoId: number, conceptoId: number, periodoNombre: string, importe: number): Observable<void> {
    
    // Armamos el payload con la estructura exacta que pide tu Swagger
    const payload = {
      alumnoId: Number(alumnoId),
      periodoNombre: periodoNombre.trim(),
      periodo: periodoNombre.trim(),        // 🌟 Fallback rústico por si las moscas
      conceptoId: Number(conceptoId),
      importe: Number(importe)
    };

    // 🌟 TRUCO CLAVE: En Angular, para pasar un BODY en un DELETE se usa la propiedad 'body' dentro de las opciones
    // ✅ CORRECTO - para post() el segundo argumento ES el body directamente
    return this.http.post<void>(`${this.baseUrl}/concepto/novedades/anular`, payload);
  }

  // 4. Obtener novedades cargadas por curso (para ver qué se aplicó)
  getNovedadesPorCurso(cursoId: number, periodo: string, ciclo: string): Observable<NovedadCursoDto[]> {
    const params = { cursoId: cursoId.toString(), periodo, ciclo };
    return this.http.get<NovedadCursoDto[]>(`${this.baseUrl}/concepto/novedades/curso/${cursoId}`, { params });
  }
 
  // 5. Grabar novedad masiva por curso
  guardarNovedadCurso(cursoId: number, novedadCurso: NovedadCargaDto): Observable<void> {
    const params = { ciclo: (novedadCurso as any).ciclo || '' };
    return this.http.post<void>(`${this.baseUrl}/concepto/novedades/curso/${cursoId}/agregar-todos`, novedadCurso, { params });
  }
 
  // 6. Eliminar novedades en bloque de un curso
  eliminarNovedadCurso(cursoId: number, payload: any): Observable<void> {
    const params = {
      periodoNombre: payload.periodoNombre,
      ciclo: payload.ciclo
    };
    return this.http.post<void>(`${this.baseUrl}/concepto/novedades/curso/${cursoId}/anular-todos`, null, { params });
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

  // Obtiene el listado completo de deudores de la institución
  getDeudaGeneral(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/facturacion/reportes/deuda-general`);
  }

  // Descarga el reporte consolidado en formato PDF
  descargarPdfDeudaGeneral(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/facturacion/reportes/deuda-general-pdf`, {
      responseType: 'blob'
    });
  }

  // Lista todos los ciclos lectivos registrados en la BD
  listarCiclosLectivosCompletos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ciclos-lectivos`);
  }

// 🌟 CORREGIDO: Único endpoint POST que guarda o actualiza según si viaja el cicloId
  guardarOCorregirCicloLectivo(ciclo: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/ciclos-lectivos/guardar`, ciclo);
  }

  // En tu servicio (ColegioServ)
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

// 🌟 Vista previa: todos los alumnos del curso, marcados como facturado/pendiente
previewFacturaCurso(cursoId: number, periodoId: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/facturacion/preview-curso`, {
    params: { cursoId: cursoId.toString(), periodoId: periodoId.toString() }
  });
}

// 🌟 "Facturar por Curso": agrupa las novedades pendientes de cada alumno del curso
// en una factura nueva, para el período y vencimiento indicados.
facturarCurso(dto: { cursoId: number; periodoId: number; fechaVencimiento: string }): Observable<any> {
  return this.http.post(`${this.baseUrl}/facturacion/facturar-curso`, dto);
}

// 🌟 Vista previa: todos los conceptos (facturados y pendientes) del curso/período
consultarFacturaCurso(cursoId: number, periodoId: number): Observable<any> {
  return this.http.get(`${this.baseUrl}/facturacion/consultar-curso`, {
    params: { cursoId: cursoId.toString(), periodoId: periodoId.toString() }
  });
}

// En tu servicio
buscarAlumnos(query: string): Observable<AlumnoDto[]> {
  return this.http.get<AlumnoDto[]>(`${this.baseUrl}/alumno/buscar?query=${query}`);
}
}