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
  
  // 🌟 SINK REAL: Señal elástica para guardar el array de strings del Back
  ciclosDisponibles = signal<string[]>([]);

  cursoSeleccionadoId: number | null = null;
  periodoSeleccionadoDescripcion: string = '';
  cicloSeleccionadoNombre: string = '2026'; // Año por defecto inicial
  conceptoSeleccionadoId: number | null = null;
  importeCarga: number | null = null;

  procesando = false;
  cargandoTabla = false;
  listaVistaPrevia: any[] = [];

  ngOnInit(): void {
    // 1. 🌟 DINÁMICO: Consumimos tu método real que trae los strings del Back
    this.service.getCiclosDisponibles().subscribe({
      next: (años: string[]) => {
        this.ciclosDisponibles.set(años || []);

        // Intentamos preseleccionar el año en curso real si existe en el array
        const anioActualStr = new Date().getFullYear().toString();
        if (años && años.includes(anioActualStr)) {
          this.cicloSeleccionadoNombre = anioActualStr;
        } else if (años && años.length > 0) {
          this.cicloSeleccionadoNombre = años[0];
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al recuperar ciclos del endpoint:", err)
    });

    // 2. Cargamos las divisiones mediante el método paginado oficial
    this.service.listarCursos(0, 50).subscribe({
      next: (res: any) => {
        const listaExtraida = res?.content || res || [];
        this.cursos.set(listaExtraida);
        
        const cursoUrlNombre = this.route.snapshot.queryParamMap.get('cursoId');
        if (cursoUrlNombre) {
          const cursoEncontrado = listaExtraida.find((c: any) => 
            (c.nombre || c.descripcion || '').trim().toUpperCase() === cursoUrlNombre.trim().toUpperCase()
          );

          if (cursoEncontrado) {
            this.cursoSeleccionadoId = cursoEncontrado.cursoId || cursoEncontrado.id;
            this.consultarNovedadesExistentes();
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al recuperar divisiones:", err)
    });
    
    // 3. Cargamos períodos históricos
    this.service.getPeriodosHistoricos().subscribe((res: any) => {
      const content = res?.content || res || [];
      this.periodosRaw.set(content);
      if (content.length > 0) {
        this.periodoSeleccionadoDescripcion = content[0].descripcion;
      }
      this.cdr.detectChanges();
    });

    // 4. Cargamos conceptos disponibles
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

  // 🌟 NUEVO MÉTODO: Autocompleta el importe según el concepto elegido
  onConceptoChange() {
    if (!this.conceptoSeleccionadoId) {
      this.importeCarga = null;
      return;
    }

    // Buscamos el objeto concepto seleccionado en nuestra señal
    const conceptoSeleccionado = this.conceptosDisponibles().find(c => c.id === Number(this.conceptoSeleccionadoId));

    if (conceptoSeleccionado && conceptoSeleccionado.importeBase !== null && conceptoSeleccionado.importeBase > 0) {
      // ✅ Si tiene un importe ya establecido mayor a $0, lo clavamos automáticamente
      this.importeCarga = conceptoSeleccionado.importeBase;
    } else {
      // ✏️ Si el importe base es 0 o null, dejamos el casillero limpio para carga manual
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

    if (!nombreCursoTexto) {
      this.cargandoTabla = false;
      this.cdr.detectChanges();
      return;
    }

    this.service.getAlumnosPorCurso(nombreCursoTexto).subscribe({
      next: (res: any) => {
        const estudiantes = res?.alumnos || [];
        
        if (estudiantes.length === 0) {
          this.listaVistaPrevia = [];
          this.cargandoTabla = false;
          this.cdr.detectChanges();
          return;
        }

        let procesados = 0;
        const temporalAuditoria: any[] = [];

        estudiantes.forEach((alumno: any) => {
          this.service.getNovedadesPorAlumno(alumno.alumnoId, this.periodoSeleccionadoDescripcion).subscribe({
            next: (novRes: any) => {
              const novedadesDelMes = novRes?.detallesGrilla || novRes || [];
              
              if (novedadesDelMes.length > 0) {
                novedadesDelMes.forEach((n: any) => {
                  temporalAuditoria.push({
                    legajo: alumno.alumnoId,
                    alumno: alumno.nombreCompleto,
                    estado: n.estado || 'Pendiente',
                    concepto: n.concepto || 'Arancel Educativo',
                    importe: Number(n.importe || 0)
                  });
                });
              } else {
                temporalAuditoria.push({
                  legajo: alumno.alumnoId,
                  alumno: alumno.nombreCompleto,
                  estado: 'Sin Novedad',
                  concepto: '---',
                  importe: 0
                });
              }

              procesados++;
              if (procesados === estudiantes.length) {
                this.listaVistaPrevia = temporalAuditoria.sort((a, b) => a.alumno.localeCompare(b.alumno));
                this.cargandoTabla = false;
                this.cdr.detectChanges();
              }
            },
            error: () => {
              procesados++;
              if (procesados === estudiantes.length) {
                this.listaVistaPrevia = temporalAuditoria;
                this.cargandoTabla = false;
                this.cdr.detectChanges();
              }
            }
          });
        });
      },
      error: (err) => {
        console.error("Error al recuperar estructura del aula:", err);
        this.listaVistaPrevia = [];
        this.cargandoTabla = false;
        this.cdr.detectChanges();
      }
    });
  }

  aplicarNovedadMasiva() {
    if (!this.cursoSeleccionadoId || !this.periodoSeleccionadoDescripcion || !this.conceptoSeleccionadoId) {
      alert("Complete los parámetros obligatorios (Curso, Período y Concepto).");
      return;
    }
    if (this.importeCarga === null || this.importeCarga <= 0) {
      alert("Ingrese un importe numérico válido mayor a $0.00.");
      return;
    }

    const perObj = this.periodosRaw().find(p => p.descripcion === this.periodoSeleccionadoDescripcion);
    const periodoId = perObj ? (perObj.periodoId || perObj.id) : null;

    if (!periodoId) {
      alert("Error: No se pudo localizar el ID interno del período.");
      return;
    }

    const cursoObj = this.cursos().find(c => (c.cursoId || c.id) === Number(this.cursoSeleccionadoId));
    const nombreCursoTexto = cursoObj ? (cursoObj.nombre || cursoObj.descripcion) : '';

    if (!nombreCursoTexto) {
      alert("Error al resolver el nombre de la división.");
      return;
    }

    if (!confirm(`⚠️ Confirmación Lote: ¿Desea asentar este arancel en bloque a todos los alumnos asignados a "${nombreCursoTexto}" por un valor de $${this.importeCarga}?`)) {
      return;
    }

    this.procesando = true;
    this.cdr.detectChanges();

    this.service.getAlumnosPorCurso(nombreCursoTexto).subscribe({
      next: (res: any) => {
        const alumnosAula = res?.alumnos || [];
        
        if (alumnosAula.length === 0) {
          alert("La división seleccionada no posee alumnos matriculados.");
          this.procesando = false;
          this.cdr.detectChanges();
          return;
        }

        let guardadosExitosos = 0;
        let errores = 0;

        alumnosAula.forEach((estudiante: any) => {
          const payloadIndividual = {
            alumnoId: Number(estudiante.alumnoId),
            periodoNombre: this.periodoSeleccionadoDescripcion.trim(),
            conceptoId: Number(this.conceptoSeleccionadoId),
            importe: Number(this.importeCarga)
          };

          this.service.agregarNovedadManual(payloadIndividual).subscribe({
            next: () => {
              guardadosExitosos++;
              if ((guardadosExitosos + errores) === alumnosAula.length) {
                this.finalizarProcesoAltaMasiva(guardadosExitosos);
              }
            },
            error: (err) => {
              console.error(`Falla en legajo #${estudiante.alumnoId}:`, err);
              errores++;
              if ((guardadosExitosos + errores) === alumnosAula.length) {
                this.finalizarProcesoAltaMasiva(guardadosExitosos);
              }
            }
          });
        });
      },
      error: (err) => {
        console.error("Error al traer alumnos para el lote:", err);
        alert("No se pudo recuperar la nómina del curso.");
        this.procesando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private finalizarProcesoAltaMasiva(cantidad: number) {
    alert(`¡Proceso finalizado! Se asentaron con éxito ${cantidad} deudas arancelarias en el sistema.`);
    this.importeCarga = null;
    this.procesando = false;
    this.consultarNovedadesExistentes(); 
  }

  eliminarNovedadMasiva() {
    if (!this.cursoSeleccionadoId || !this.periodoSeleccionadoDescripcion || !this.conceptoSeleccionadoId) {
      alert("Debe seleccionar Curso, Período y Concepto para ejecutar la baja masiva.");
      return;
    }

    const cursoObj = this.cursos().find(c => (c.cursoId || c.id) === Number(this.cursoSeleccionadoId));
    const nombreCursoTexto = cursoObj ? (cursoObj.nombre || cursoObj.descripcion) : '';

    if (!nombreCursoTexto) {
      alert("Error al resolver el nombre de la división.");
      return;
    }

    const conObj = this.conceptosDisponibles().find(c => c.id === Number(this.conceptoSeleccionadoId));
    const nombreConceptoTexto = conObj ? conObj.nombre : 'Concepto seleccionado';

    const registroEnPantalla = this.listaVistaPrevia.find(item => 
      item.legajo && 
      item.concepto.trim().toUpperCase() === nombreConceptoTexto.trim().toUpperCase() &&
      item.estado !== 'Sin Novedad'
    );

    const importeABorrar = registroEnPantalla ? Number(registroEnPantalla.importe) : 0;

    if (!confirm(`💥 ADVERTENCIA CRÍTICA:\nSe eliminará el concepto "${nombreConceptoTexto}" en el período "${this.periodoSeleccionadoDescripcion}" para TODOS los alumnos de "${nombreCursoTexto}" que no estén facturados.\n\n¿Desea proceder con la baja en bloque?`)) {
      return;
    }

    this.procesando = true;
    this.cdr.detectChanges();

    this.service.getAlumnosPorCurso(nombreCursoTexto).subscribe({
      next: (res: any) => {
        const alumnosAula = res?.alumnos || [];
        
        if (alumnosAula.length === 0) {
          alert("La división seleccionada no posee alumnos matriculados.");
          this.procesando = false;
          this.cdr.detectChanges();
          return;
        }

        let eliminadosExitosos = 0;
        let errores = 0;

        alumnosAula.forEach((estudiante: any) => {
          this.service.eliminarNovedadIndividual(
            Number(estudiante.alumnoId),
            Number(this.conceptoSeleccionadoId),
            this.periodoSeleccionadoDescripcion.trim(),
            importeABorrar
          ).subscribe({
            next: () => {
              eliminadosExitosos++;
              if ((eliminadosExitosos + errores) === alumnosAula.length) {
                this.finalizarProcesoBajaMasiva(eliminadosExitosos);
              }
            },
            error: (err) => {
              console.error(`No se pudo anular legajo #${estudiante.alumnoId}:`, err);
              errores++;
              if ((eliminadosExitosos + errores) === alumnosAula.length) {
                this.finalizarProcesoBajaMasiva(eliminadosExitosos);
              }
            }
          });
        });
      },
      error: (err) => {
        console.error("Error al traer estructura para la baja:", err);
        alert("No se pudo recuperar la nómina del curso.");
        this.procesando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private finalizarProcesoBajaMasiva(cantidad: number) {
    alert(`¡Baja masiva finalizada! Se procesaron las anulaciones del curso en el sistema.`);
    this.procesando = false;
    this.consultarNovedadesExistentes();
  }
}