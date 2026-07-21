import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ColegioServ } from '../../services/colegio-serv'; 
import { FacturaService } from '../../services/factura-service';
import { FormsModule } from '@angular/forms'; // 🌟 CLAVE 1: Módulo requerido para utilizar [(ngModel)] en componentes Standalone

@Component({
  selector: 'app-lista-alumnos',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    FormsModule // 🌟 CLAVE 2: Habilita el bindeo bidireccional y el parser de plantillas del buscador
  ],
  templateUrl: './lista-alumnos.html',
  styleUrl: './lista-alumnos.scss'
})
export class ListaAlumnosComponent implements OnInit {
  private colegioService = inject(ColegioServ);
  private facturaService = inject(FacturaService);
  private route = inject(ActivatedRoute); 
  private cdr = inject(ChangeDetectorRef);

mostrarCartelMensaje = false;
  cartelTitulo = '';
  cartelMensaje = '';
  cartelTipo: 'pregunta' | 'alerta' = 'alerta';
  alumnoPendienteAccion: any = null;
  accionActual: 'matricular' | 'desvincular' = 'matricular';
  
  datosCurso?: any; // Tipado flexible para el bindeo dinámico seguro
  generandoPdf = false;
  nombreCursoUrl: string = '';

  // VARIABLES PARA EL MODAL DE MORA GLOBAL DEL CURSO
  mostrarModalDeuda = false;
  cargandoDeuda = false;
  reporteDeudaCurso: any = null;
  generandoPdfMora = false;

  // VARIABLES PARA EL MODAL DE MATRICULACIÓN (+)
  mostrarModalAgregarAlumno = false;
  cargandoAlumnosLibres = false;
  alumnosLibres: any[] = []; 
  terminoBusquedaAlumno: string = '';

  ngOnInit() {
    this.route.params.subscribe(params => {
      const nombreCodificado = params['nombreCurso'];
      if (nombreCodificado) {
        this.nombreCursoUrl = decodeURIComponent(nombreCodificado);
        this.cargarDatos(this.nombreCursoUrl);
      }
    });
  }

  cargarDatos(nombreCurso: string) {
    this.datosCurso = undefined; 
    
    this.colegioService.getAlumnosPorCurso(nombreCurso).subscribe({
      next: (data: any) => {
        if (data) {
          const nombreValidado = data.nombreCurso || data.descripcion || data.nombre || this.nombreCursoUrl;
          this.datosCurso = {
            idCurso: data.idCurso || data.id || data.cursoId || 0,
            nombreCurso: nombreValidado,
            nombreMaestro: data.nombreMaestro || 'Docente no asignado',
            nombreEstablecimiento: data.nombreEstablecimiento || 'SGA',
            nombreTurno: data.nombreTurno || 'N/A',
            nombreCiclo: data.nombreCiclo || '',
            alumnos: data.alumnos || []
          };
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar el curso:', err);
        this.cdr.detectChanges();
      }
    });
  }

  // Abre el modal y consulta los alumnos vacantes pasando un string vacío "" al filtro real
  abrirModalAgregar() {
    this.mostrarModalAgregarAlumno = true;
    this.cargandoAlumnosLibres = true;
    this.terminoBusquedaAlumno = '';
    this.alumnosLibres = [];
    this.cdr.detectChanges();

    this.colegioService.getAlumnosPorCursoFiltro("").subscribe({
      next: (data: any[]) => {
        this.alumnosLibres = data || [];
        this.cargandoAlumnosLibres = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al traer alumnos sin curso:", err);
        this.cargandoAlumnosLibres = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 🌟 CLAVE 3: PROPIEDAD COMPUTADA REQUERIDA POR EL @FOR DEL MODAL EN EL HTML
  get alumnosLibresFiltrados() {
    if (!this.terminoBusquedaAlumno.trim()) return this.alumnosLibres;
    const txt = this.terminoBusquedaAlumno.toLowerCase().trim();
    return this.alumnosLibres.filter(a => 
      String(a.alumnoId || a.id).includes(txt) || 
      (a.nombreCompleto || a.alumno || '').toLowerCase().includes(txt)
    );
  }

  // Guarda la matrícula usando el POST individual de tu AlumnoController (+)
 matricularAlumno(alumno: any) {
    this.alumnoPendienteAccion = alumno;
    this.accionActual = 'matricular';
    const nombre = alumno.nombreCompleto || alumno.alumno || `${alumno.apellido}, ${alumno.nombre}`;
    
    this.cartelTipo = 'pregunta';
    this.cartelTitulo = 'Matricular Alumno';
    this.cartelMensaje = `¿Desea incorporar a ${nombre.toUpperCase()} a este curso?`;
    this.mostrarCartelMensaje = true;
    this.cdr.detectChanges();
  }

  desvincularAlumno(alumno: any) {
    this.alumnoPendienteAccion = alumno;
    this.accionActual = 'desvincular';
    const nombre = alumno.nombreCompleto || alumno.alumno;
    
    this.cartelTipo = 'pregunta';
    this.cartelTitulo = 'Confirmar Quita';
    this.cartelMensaje = `💥 ADVERTENCIA: ¿Está seguro de quitar a ${nombre.toUpperCase()} de este curso? Quedará sin división asignada.`;
    this.mostrarCartelMensaje = true;
    this.cdr.detectChanges();
  }

  // Consulta la mora del aula cruzando los datos contables
  abrirModalDeudaCurso() {
    if (!this.nombreCursoUrl) return;
    this.mostrarModalDeuda = true;
    this.cargandoDeuda = true;
    this.reporteDeudaCurso = null;
    this.cdr.detectChanges();

    this.facturaService.getDeudaPorCurso(this.nombreCursoUrl).subscribe({
      next: (data: any) => {
        if (data) {
          const listaCruda = data.detalles || (Array.isArray(data) ? data : []);
          
          const detallesProcesados = listaCruda.map((item: any) => {
            const idValidado = item.alumnoId ?? item.alumno_id ?? item.id_alumno ?? item.legajo ?? 0;
            const nombreValidado = item.nombreCompleto ?? item.nombre_completo ?? item.apellido_y_nombre ?? item.alumno ?? '';
            const vencimientoValidado = item.fechaVencimiento ?? item.fecha_vencimiento ?? item.primerVenc ?? item.primer_venc ?? null;
            const deudaValidada = item.totalDeuda ?? item.total_deuda ?? item.importe ?? 0;

            return {
              alumnoId: idValidado,
              nombreCompleto: nombreValidado,
              fechaVencimiento: vencimientoValidado,
              totalDeuda: Number(deudaValidada)
            };
          });

          const totalCursoMapeado = data.totalDeudaCurso ?? data.total_deuda_curso ?? 
                                    detallesProcesados.reduce((acc: number, i: any) => acc + i.totalDeuda, 0);

          this.reporteDeudaCurso = {
            nombreCurso: data.nombreCurso ?? this.nombreCursoUrl,
            nombreCiclo: data.nombreCiclo ?? '',
            totalDeudaCurso: Number(totalCursoMapeado),
            detalles: detallesProcesados
          };
        } else {
          this.reporteDeudaCurso = { nombreCurso: this.nombreCursoUrl, nombreCiclo: '', totalDeudaCurso: 0, detalles: [] };
        }

        this.cargandoDeuda = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error crítico al recuperar saldos grupales en el modal:', err);
        this.reporteDeudaCurso = { nombreCurso: this.nombreCursoUrl, nombreCiclo: '', totalDeudaCurso: 0, detalles: [] };
        this.cargandoDeuda = false;
        this.cdr.detectChanges();
      }
    });
  }

  descargarPdfMora() {
    if (!this.nombreCursoUrl) return;
    this.generandoPdfMora = true;
    this.cdr.detectChanges();

    this.facturaService.descargarPdfDeudaCurso(this.nombreCursoUrl).subscribe({
      next: (blob: Blob) => {
        const fileURL = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = `Mora_Curso_${this.nombreCursoUrl.replace(/\s+/g, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(fileURL);
        this.generandoPdfMora = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al bajar PDF corporativo:', err);
        this.generandoPdfMora = false;
        this.cdr.detectChanges();
      }
    });
  }

  imprimirLista() {
    if (!this.nombreCursoUrl) return;
    this.generandoPdf = true;
    this.cdr.detectChanges();

    this.colegioService.descargarPdfAlumnosPorCurso(this.nombreCursoUrl).subscribe({
      next: (blob: Blob) => {
        const fileURL = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        window.open(fileURL, '_blank');
        this.generandoPdf = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al generar el PDF de alumnos:", err);
        this.generandoPdf = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Nuevo método centralizador que ejecuta la lógica real tras el "SÍ"
ejecutarAccionConfirmada() {
  this.mostrarCartelMensaje = false;
  if (!this.alumnoPendienteAccion) return;

  const id = this.alumnoPendienteAccion.alumnoId || this.alumnoPendienteAccion.id;

  if (this.accionActual === 'matricular') {
    // Asegúrate de que este servicio coincida con el nombre en tu ColegioServ
    this.colegioService.asignarAlumnoACurso(Number(id), this.nombreCursoUrl).subscribe({
      next: () => {
        this.mostrarModalAgregarAlumno = false;
        this.cargarDatos(this.nombreCursoUrl);
      },
      error: (err) => {
        console.error("Error en asignación:", err);
        alert("Error al matricular el alumno.");
      }
    });
  } else if (this.accionActual === 'desvincular') {
    this.colegioService.quitarAlumnoDeCurso(Number(id)).subscribe({
      next: () => this.cargarDatos(this.nombreCursoUrl),
      error: (err) => {
        console.error("Error en desvinculación:", err);
        alert("Error al remover el alumno.");
      }
    });
  }
  this.alumnoPendienteAccion = null;
}
}