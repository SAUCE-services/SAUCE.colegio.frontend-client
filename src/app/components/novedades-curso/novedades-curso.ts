import { Component, inject, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColegioServ } from '../../services/colegio-serv';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-novedades-curso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './novedades-curso.html',
  styleUrl: './novedades-curso.scss'
})
export class NovedadesCursoComponent implements OnInit {
  private service = inject(ColegioServ);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  cursos = signal<any[]>([]); 
  periodosRaw = signal<any[]>([]); 
  conceptosDisponibles = signal<any[]>([]); 
  ciclosDisponibles = signal<string[]>([]);

  cursoSeleccionadoId: number | null = null;
  periodoSeleccionadoDescripcion: string = '';
  cicloSeleccionadoNombre: string = '2026';
  conceptoSeleccionadoId: number | null = null;
  importeCarga: number | null = null;

  procesando = false;
  cargandoTabla = false;
  listaVistaPrevia: any[] = [];

  // 🌟 Variables para el sistema de Carteles Custom
  mostrarCartelMensaje = false;
  cartelTitulo = '';
  cartelMensaje = '';
  cartelTipo: 'pregunta' | 'exito' | 'error' = 'exito';
  accionPendiente: 'alta' | 'baja' | null = null;

  ngOnInit(): void {
    this.service.getCiclosDisponibles().subscribe({
      next: (años: string[]) => {
        this.ciclosDisponibles.set(años || []);
        const anioActualStr = new Date().getFullYear().toString();
        if (años && años.includes(anioActualStr)) {
          this.cicloSeleccionadoNombre = anioActualStr;
        } else if (años && años.length > 0) {
          this.cicloSeleccionadoNombre = años[0];
        }
        this.cdr.detectChanges();
      }
    });

    this.service.listarCursos(0, 50).subscribe({
      next: (res: any) => {
        const listaExtraida = res?.content || res || [];
        this.cursos.set(listaExtraida);
        const nombreCursoUrl = this.route.snapshot.queryParamMap.get('cursoNombre');
        if (nombreCursoUrl) {
          const cursoEncontrado = listaExtraida.find((c: any) => 
            (c.nombre || c.descripcion || '').trim().toUpperCase() === nombreCursoUrl.trim().toUpperCase()
          );
          if (cursoEncontrado) {
            this.cursoSeleccionadoId = cursoEncontrado.cursoId || cursoEncontrado.id;
            this.consultarNovedadesExistentes();
          }
        }
        this.cdr.detectChanges();
      }
    });

    this.service.getPeriodosHistoricos().subscribe((res: any) => {
      const content = res?.content || res || [];
      this.periodosRaw.set(content);
      if (content.length > 0) this.periodoSeleccionadoDescripcion = content[0].descripcion;
      this.cdr.detectChanges();
    });

    this.service.getConceptosCombo().subscribe((data: any) => {
      const listaExtraida = Array.isArray(data) ? data : (data?.content || []);
      const mapped = listaExtraida.map((c: any) => ({
        id: c.conceptoId || c.id || 0,
        nombre: c.descripcion || c.nombre || '',
        importeBase: c.importe !== undefined ? Number(c.importe) : null 
      }));
      this.conceptosDisponibles.set(mapped);
      this.cdr.detectChanges();
    });
  }

  onConceptoChange() {
    if (!this.conceptoSeleccionadoId) {
      this.importeCarga = null;
      return;
    }
    const conceptoSeleccionado = this.conceptosDisponibles().find(c => c.id === Number(this.conceptoSeleccionadoId));
    if (conceptoSeleccionado && conceptoSeleccionado.importeBase !== null && conceptoSeleccionado.importeBase > 0) {
      this.importeCarga = conceptoSeleccionado.importeBase;
    } else {
      this.importeCarga = null;
    }
    this.cdr.detectChanges();
  }

  consultarNovedadesExistentes() {
    if (!this.cursoSeleccionadoId || !this.periodoSeleccionadoDescripcion || !this.cicloSeleccionadoNombre) return;
    this.cargandoTabla = true;
    this.listaVistaPrevia = [];
    this.cdr.detectChanges();
    
    const cursoObj = this.cursos().find(c => (c.cursoId || c.id) === Number(this.cursoSeleccionadoId));
    const nombreCursoTexto = cursoObj ? (cursoObj.nombre || cursoObj.descripcion) : '';
    if (!nombreCursoTexto) { this.cargandoTabla = false; this.cdr.detectChanges(); return; }

    this.service.getAlumnosPorCurso(nombreCursoTexto).subscribe({
      next: (res: any) => {
        const estudiantes = res?.alumnos || [];
        if (estudiantes.length === 0) { this.cargandoTabla = false; this.cdr.detectChanges(); return; }
        let procesados = 0;
        const temporalAuditoria: any[] = [];
        estudiantes.forEach((alumno: any) => {
          this.service.getNovedadesPorAlumno(alumno.alumnoId, this.periodoSeleccionadoDescripcion).subscribe({
            next: (novRes: any) => {
              const novedades = novRes?.detallesGrilla || novRes || [];
              if (novedades.length > 0) {
                novedades.forEach((n: any) => {
                  temporalAuditoria.push({ legajo: alumno.alumnoId, alumno: alumno.nombreCompleto, estado: n.estado || 'Pendiente', concepto: n.concepto || 'Arancel', importe: Number(n.importe || 0) });
                });
              } else {
                temporalAuditoria.push({ legajo: alumno.alumnoId, alumno: alumno.nombreCompleto, estado: 'Sin Novedad', concepto: '---', importe: 0 });
              }
              procesados++;
              if (procesados === estudiantes.length) { this.listaVistaPrevia = temporalAuditoria.sort((a, b) => a.alumno.localeCompare(b.alumno)); this.cargandoTabla = false; this.cdr.detectChanges(); }
            },
            error: () => { procesados++; if (procesados === estudiantes.length) { this.cargandoTabla = false; this.cdr.detectChanges(); } }
          });
        });
      }
    });
  }

  // 🌟 MÉTODOS DE CONFIRMACIÓN CON CARTEL CUSTOM
  aplicarNovedadMasiva() {
    if (!this.cursoSeleccionadoId || !this.periodoSeleccionadoDescripcion || !this.conceptoSeleccionadoId) {
      this.lanzarCartel('Error', 'Complete los parámetros obligatorios.', 'error');
      return;
    }
    this.accionPendiente = 'alta';
    this.lanzarCartel('Confirmar Lote', `¿Desea asentar este arancel en bloque por $${this.importeCarga}?`, 'pregunta');
  }

  eliminarNovedadMasiva() {
    this.accionPendiente = 'baja';
    this.lanzarCartel('Confirmar Baja', '¿Está seguro de eliminar las novedades masivas seleccionadas?', 'pregunta');
  }

  private lanzarCartel(titulo: string, mensaje: string, tipo: 'pregunta' | 'exito' | 'error') {
    this.cartelTitulo = titulo;
    this.cartelMensaje = mensaje;
    this.cartelTipo = tipo;
    this.mostrarCartelMensaje = true;
    this.cdr.detectChanges();
  }

  ejecutarAccionConfirmada() {
    this.mostrarCartelMensaje = false;
    this.procesando = true;
    const cursoObj = this.cursos().find(c => (c.cursoId || c.id) === Number(this.cursoSeleccionadoId));
    const nombreCursoTexto = cursoObj ? (cursoObj.nombre || cursoObj.descripcion) : '';

    this.service.getAlumnosPorCurso(nombreCursoTexto).subscribe({
      next: (res: any) => {
        const alumnosAula = res?.alumnos || [];
        let contador = 0;
        alumnosAula.forEach((estudiante: any) => {
          if (this.accionPendiente === 'alta') {
            this.service.agregarNovedadManual({ alumnoId: Number(estudiante.alumnoId), periodoNombre: this.periodoSeleccionadoDescripcion, conceptoId: Number(this.conceptoSeleccionadoId), importe: Number(this.importeCarga) }).subscribe(() => {
              contador++; if (contador === alumnosAula.length) this.finalizarProcesoAltaMasiva(contador);
            });
          } else {
            this.service.eliminarNovedadIndividual(Number(estudiante.alumnoId), Number(this.conceptoSeleccionadoId), this.periodoSeleccionadoDescripcion, 0).subscribe(() => {
              contador++; if (contador === alumnosAula.length) this.finalizarProcesoBajaMasiva(contador);
            });
          }
        });
      }
    });
  }

  private finalizarProcesoAltaMasiva(cantidad: number) {
    this.procesando = false;
    this.lanzarCartel('Éxito', `Se asentaron ${cantidad} novedades correctamente.`, 'exito');
    this.consultarNovedadesExistentes();
  }

  private finalizarProcesoBajaMasiva(cantidad: number) {
    this.procesando = false;
    this.lanzarCartel('Éxito', `Se eliminaron ${cantidad} novedades correctamente.`, 'exito');
    this.consultarNovedadesExistentes();
  }
}