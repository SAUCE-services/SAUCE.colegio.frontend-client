import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColegioServ } from '../../services/colegio-serv';
import { ConceptoService } from '../../services/concepto-service';
import { PeriodoService } from '../../services/periodo-service';
import { NovedadesAlumnoResponseDto } from '../../models/colegio.models';

@Component({
  selector: 'app-novedades-alumno',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './novedades-alumno.html',
  styleUrl: './novedades-alumno.scss'
})
export class NovedadesAlumnoComponent {
  private service = inject(ColegioServ);
  private conceptoService = inject(ConceptoService);
  private periodoService = inject(PeriodoService);
  private cdr = inject(ChangeDetectorRef);

  // 🔎 Búsqueda por legajo o por nombre (con autocompletado)
  legajo: number | null = null;
  nombreAlumno: string = '';
  resultadosBusqueda: any[] = [];
  mostrarSugerencias = false;
  indiceSugerenciaActiva = -1;

  cargandoNovedades = false;
  reporteNovedades: NovedadesAlumnoResponseDto | null = null;

  // FILTRO REACTIVO PERÍODO
  periodoFiltro: string = '';
  periodosDisponibles: string[] = [];

  // FORMULARIO CARGA MANUAL
  mostrarFormularioAlta = false;
  guardandoNovedad = false;
  conceptoSeleccionadoId: number | null = null;
  importeNovedad: number | null = null;
  conceptosDisponibles: any[] = [];

  // 🌟 Cartel de confirmación / alerta custom
  mostrarCartelMensaje = false;
  cartelTipo: 'pregunta' | 'alerta' = 'alerta';
  cartelTitulo: string = '';
  cartelMensaje: string = '';
  novedadPendienteAnular: any = null;

  get novedadesFiltradas() {
    if (!this.reporteNovedades || !this.reporteNovedades.novedades) return [];
    if (!this.periodoFiltro) return this.reporteNovedades.novedades;
    return this.reporteNovedades.novedades.filter(n => n.nombrePeriodo === this.periodoFiltro);
  }

  // Búsqueda en tiempo real por Apellido y Nombre
  buscarEnTiempoReal() {
    this.indiceSugerenciaActiva = -1;

    if (this.nombreAlumno.length < 3) {
      this.resultadosBusqueda = [];
      this.mostrarSugerencias = false;
      return;
    }

    this.service.buscarAlumnos(this.nombreAlumno).subscribe(data => {
      this.resultadosBusqueda = data;
      this.mostrarSugerencias = data.length > 0;
      this.indiceSugerenciaActiva = -1;
    });
  }

  // Al hacer clic en un resultado del dropdown
  seleccionarAlumno(alumno: any) {
    this.legajo = alumno.alumnoId;
    this.nombreAlumno = alumno.nombreCompleto;
    this.resultadosBusqueda = [];
    this.mostrarSugerencias = false;
    this.indiceSugerenciaActiva = -1;
    this.consultarAlumno();
  }

  // Maneja flechas ↑↓, Enter y Escape en el dropdown de sugerencias
  manejarTecladoSugerencias(event: KeyboardEvent) {
    if (!this.mostrarSugerencias || this.resultadosBusqueda.length === 0) {
      if (event.key === 'Enter') {
        this.consultarAlumno();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.indiceSugerenciaActiva =
          (this.indiceSugerenciaActiva + 1) % this.resultadosBusqueda.length;
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.indiceSugerenciaActiva =
          (this.indiceSugerenciaActiva - 1 + this.resultadosBusqueda.length) %
          this.resultadosBusqueda.length;
        break;

      case 'Enter':
        event.preventDefault();
        if (this.indiceSugerenciaActiva >= 0) {
          this.seleccionarAlumno(this.resultadosBusqueda[this.indiceSugerenciaActiva]);
        } else {
          this.consultarAlumno();
        }
        break;

      case 'Escape':
        this.mostrarSugerencias = false;
        this.indiceSugerenciaActiva = -1;
        break;
    }
  }

  buscarPorLegajo() {
    if (!this.legajo) return;
    this.service.getAlumnoPorLegajo(this.legajo).subscribe((data: any) => {
      this.nombreAlumno = `${data.apellido}, ${data.nombre}`;
    });
  }

  buscarPorLegajoPromise(): Promise<void> {
    return new Promise((resolve) => {
      this.service.getAlumnoPorLegajo(this.legajo!).subscribe({
        next: (data: any) => {
          this.nombreAlumno = `${data.apellido}, ${data.nombre}`;
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  async onEnterLegajo() {
    if (this.legajo) {
      await this.buscarPorLegajoPromise();
      this.consultarAlumno();
    }
  }

  onConceptoChange() {
    if (!this.conceptoSeleccionadoId) {
      this.importeNovedad = null;
      return;
    }
    const conceptoSeleccionado = this.conceptosDisponibles.find(c => c.id === Number(this.conceptoSeleccionadoId));
    if (conceptoSeleccionado && conceptoSeleccionado.importeBase !== null && conceptoSeleccionado.importeBase > 0) {
      this.importeNovedad = conceptoSeleccionado.importeBase;
    } else {
      this.importeNovedad = null;
    }
    this.cdr.detectChanges();
  }

  // 🌟 Trae los combos (conceptos/períodos) y las novedades del alumno elegido
  consultarAlumno() {
    if (!this.legajo) {
      this.lanzarCartel('Atención', 'Por favor, ingrese o busque un legajo primero.', 'alerta');
      return;
    }

    this.cargandoNovedades = true;
    this.reporteNovedades = null;
    this.cdr.detectChanges();

    this.conceptoService.getConceptosCombo().subscribe({
      next: (data: any) => {
        const listaExtraida = Array.isArray(data) ? data : (data?.content || []);
        this.conceptosDisponibles = listaExtraida.map((c: any) => ({
          id: c.conceptoId || c.id || 0,
          nombre: c.descripcion || c.nombre || '',
          importeBase: c.importe !== undefined ? Number(c.importe) : null
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error preventivo al cargar conceptos:", err)
    });

    this.periodoService.getPeriodosHistoricos().subscribe({
      next: (res: any) => {
        const listaPeriodos = res?.content || [];
        if (listaPeriodos.length > 0) {
          this.periodosDisponibles = listaPeriodos.map((p: any) => p.descripcion);
          this.periodoFiltro = this.periodosDisponibles[0];
          this.cargarNovedadesDelServidor();
        } else {
          this.periodosDisponibles = ['MAYO - 2026'];
          this.periodoFiltro = 'MAYO - 2026';
          this.cargarNovedadesDelServidor();
        }
      },
      error: (err) => {
        console.error("Error al recuperar el listado de periodos:", err);
        this.periodosDisponibles = ['MAYO - 2026'];
        this.periodoFiltro = 'MAYO - 2026';
        this.cargarNovedadesDelServidor();
      }
    });
  }

  cargarNovedadesDelServidor() {
    if (!this.legajo || !this.periodoFiltro) return;
    this.cargandoNovedades = true;
    this.cdr.detectChanges();

    this.conceptoService.getNovedadesPorAlumno(this.legajo, this.periodoFiltro).subscribe({
      next: (data: any) => {
        if (data) {
          const listaCruda = data.detallesGrilla || [];
          const novedadesProcesadas = listaCruda.map((n: any) => {
            const rawFecha = n.fechaRegistro || n.fecha_registro || null;
            let fechaLimpia = rawFecha;
            if (rawFecha && typeof rawFecha === 'string' && rawFecha.includes('T')) {
              const soloFecha = rawFecha.split('T')[0];
              const partes = soloFecha.split('-');
              if (partes.length === 3) {
                fechaLimpia = `${partes[2]}/${partes[1]}/${partes[0]}`;
              }
            }
            return {
              nombreConcepto: n.concepto || n.nombreConcepto || '',
              nombrePeriodo: n.periodo || n.nombrePeriodo || this.periodoFiltro,
              fechaRegistro: fechaLimpia,
              importe: Number(n.importe != null ? n.importe : 0),
              procesado: n.estado === 'Concepto FACTURADO' || n.procesado === true
            };
          });
          this.reporteNovedades = {
            alumnoId: data.legajo || this.legajo || 0,
            nombreCompleto: data.nombreCompleto || this.nombreAlumno || 'Alumno Registrado',
            novedades: novedadesProcesadas
          };
        } else {
          this.reporteNovedades = { alumnoId: this.legajo || 0, nombreCompleto: '', novedades: [] };
        }
        this.cargandoNovedades = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error crítico al golpear ConceptoController:", err);
        this.reporteNovedades = { alumnoId: this.legajo || 0, nombreCompleto: '', novedades: [] };
        this.cargandoNovedades = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleFormularioAlta() {
    this.mostrarFormularioAlta = !this.mostrarFormularioAlta;
    this.conceptoSeleccionadoId = null;
    this.importeNovedad = null;
    this.cdr.detectChanges();
  }

  guardarNuevaNovedad() {
    if (!this.legajo || !this.periodoFiltro) return;
    if (!this.conceptoSeleccionadoId) {
      this.lanzarCartel('Atención', 'Debe seleccionar un concepto o arancel devengable.', 'alerta');
      return;
    }
    if (this.importeNovedad === null || this.importeNovedad <= 0) {
      this.lanzarCartel('Atención', 'Ingrese un importe válido mayor a $0.00.', 'alerta');
      return;
    }
    this.guardandoNovedad = true;
    this.cdr.detectChanges();

    const payload = {
      alumnoId: Number(this.legajo),
      periodoNombre: this.periodoFiltro.trim(),
      conceptoId: Number(this.conceptoSeleccionadoId),
      importe: Number(this.importeNovedad)
    };

    this.conceptoService.agregarNovedadManual(payload).subscribe({
      next: (grillaActualizada: any[]) => {
        if (this.reporteNovedades) {
          this.reporteNovedades.novedades = grillaActualizada.map((n: any) => {
            const rawFecha = n.fechaRegistro || n.fecha_registro || null;
            let fechaLimpia = rawFecha;
            if (rawFecha && typeof rawFecha === 'string' && rawFecha.includes('T')) {
              const soloFecha = rawFecha.split('T')[0];
              const partes = soloFecha.split('-');
              if (partes.length === 3) {
                fechaLimpia = `${partes[2]}/${partes[1]}/${partes[0]}`;
              }
            }
            return {
              nombreConcepto: n.concepto || n.nombreConcepto || '',
              nombrePeriodo: n.periodo || n.nombrePeriodo || this.periodoFiltro,
              fechaRegistro: fechaLimpia,
              importe: Number(n.importe != null ? n.importe : 0),
              procesado: n.estado === 'Concepto FACTURADO' || n.procesado === true
            };
          }) as any;
        }
        this.conceptoSeleccionadoId = null;
        this.importeNovedad = null;
        this.mostrarFormularioAlta = false;
        this.guardandoNovedad = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al registrar la novedad manual:", err);
        this.guardandoNovedad = false;
        this.lanzarCartel('Error', 'No se pudo registrar la novedad.', 'alerta');
        this.cdr.detectChanges();
      }
    });
  }

  eliminarNovedad(novedad: any) {
    this.novedadPendienteAnular = novedad;
    this.cartelTitulo = 'Confirmar Anulación';
    this.cartelMensaje = `¿Está seguro de que desea anular la novedad "${novedad.nombreConcepto}"?`;
    this.cartelTipo = 'pregunta';
    this.mostrarCartelMensaje = true;
    this.cdr.detectChanges();
  }

  // Ejecuta la baja real una vez aceptado el cartel custom
  ejecutarAnulacionConfirmada() {
    this.mostrarCartelMensaje = false;
    if (!this.novedadPendienteAnular) return;

    const novedad = this.novedadPendienteAnular;
    const nombreConceptoVisual = novedad.nombreConcepto || novedad.concepto;
    const legajoAlumno = this.legajo;
    const periodoNombre = novedad.nombrePeriodo || novedad.periodo || this.periodoFiltro;
    const conceptoObj = this.conceptosDisponibles.find(c =>
      c.nombre?.trim().toUpperCase() === nombreConceptoVisual?.trim().toUpperCase()
    );
    const idConcepto = conceptoObj ? (conceptoObj.id || conceptoObj.conceptoId) : null;
    const valorImporte = novedad.importe;

    if (!legajoAlumno || !periodoNombre || !idConcepto) {
      this.lanzarCartel('Error', 'Faltan parámetros de negocio para ejecutar la baja.', 'alerta');
      return;
    }

    this.conceptoService.eliminarNovedadIndividual(
      Number(legajoAlumno),
      Number(idConcepto),
      periodoNombre,
      Number(valorImporte)
    ).subscribe({
      next: () => {
        this.novedadPendienteAnular = null;
        this.cargarNovedadesDelServidor();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error devuelto por el Backend:", err);
        this.lanzarCartel('Error', err?.error?.message || 'El servidor rechazó la anulación.', 'alerta');
        this.cdr.detectChanges();
      }
    });
  }

  private lanzarCartel(titulo: string, mensaje: string, tipo: 'pregunta' | 'alerta') {
    this.cartelTitulo = titulo;
    this.cartelMensaje = mensaje;
    this.cartelTipo = tipo;
    this.mostrarCartelMensaje = true;
  }
}