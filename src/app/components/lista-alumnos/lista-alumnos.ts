import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ColegioServ } from '../../services/colegio-serv'; 
import { CursoDetalleResponse } from '../../models/colegio.models';

@Component({
  selector: 'app-lista-alumnos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './lista-alumnos.html',
  styleUrl: './lista-alumnos.scss'
})
export class ListaAlumnosComponent implements OnInit {
  private colegioService = inject(ColegioServ);
  private route = inject(ActivatedRoute); 
  private cdr = inject(ChangeDetectorRef);
  
  datosCurso?: CursoDetalleResponse;
  generandoPdf = false;
  nombreCursoUrl: string = '';

  // 🌟 NUEVAS VARIABLES PARA EL MODAL DE DEUDA GLOBAL DEL CURSO
  mostrarModalDeuda = false;
  cargandoDeuda = false;
  reporteDeudaCurso: any = null;
  generandoPdfMora = false;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const nombreCodificado = params['nombreCurso'];
      if (nombreCodificado) {
        this.nombreCursoUrl = decodeURIComponent(nombreCodificado);
        this.cargarDatos(this.nombreCursoUrl);
      }
    });
  }

  private cargarDatos(nombreCurso: string) {
    this.datosCurso = undefined; 
    
    this.colegioService.getAlumnosPorCurso(nombreCurso).subscribe({
      next: (data: any) => {
        if (data) {
          const nombreValidado = data.nombreCurso || data.descripcion || data.nombre || this.nombreCursoUrl;
          this.datosCurso = {
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
        this.datosCurso = {
          nombreCurso: this.nombreCursoUrl,
          nombreMaestro: 'No disponible',
          nombreEstablecimiento: 'Error de conexión',
          nombreTurno: 'N/A',
          nombreCiclo: 'N/A',
          alumnos: []
        };
        this.cdr.detectChanges();
      }
    });
  }

  // 🌟 NUEVO MÉTODO: Abre el modal y consulta la API de deudas arancelarias
  // En tu lista-alumnos.ts verificá que esté así:

abrirModalDeudaCurso() {
    if (!this.nombreCursoUrl) return;
    this.mostrarModalDeuda = true;
    this.cargandoDeuda = true;
    this.reporteDeudaCurso = null;
    this.cdr.detectChanges();

    this.colegioService.getDeudaPorCurso(this.nombreCursoUrl).subscribe({
      next: (data: any) => {
        if (data) {
          const listaCruda = data.detalles || (Array.isArray(data) ? data : []);
          
          const detallesProcesados = listaCruda.map((item: any) => {
            const idValidado = item.alumnoId ?? item.alumno_id ?? item.id_alumno ?? item.legajo ?? 0;
            const nombreValidado = item.nombreCompleto ?? item.nombre_completo ?? item.apellido_y_nombre ??  item.alumno ??'';
            
            // 🌟 Con primerVenc / primer_venc nos aseguramos de capturar la fecha del Back
            const vencimientoValidado = item.fechaVencimiento ?? item.fecha_vencimiento ?? item.primerVenc ?? item.primer_venc ?? item.fecha_venc ?? item.vencimiento ?? item.fecha_estado ?? item.fecha ?? null;
            
            const deudaValidada = item.totalDeuda ?? item.total_deuda ?? item.importe ?? item.saldo ?? 0;

            return {
              alumnoId: idValidado,
              nombreCompleto: nombreValidado,
              fechaVencimiento: vencimientoValidado,
              totalDeuda: Number(deudaValidada)
            };
          });

          const totalCursoMapeado = data.totalDeudaCurso ?? data.total_deuda_curso ?? data.total ?? 
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

  // 🌟 NUEVO MÉTODO: Descarga el PDF holgado de la mora del aula
  descargarPdfMora() {
    if (!this.nombreCursoUrl) return;
    this.generandoPdfMora = true;
    this.cdr.detectChanges();

    this.colegioService.descargarPdfDeudaCurso(this.nombreCursoUrl).subscribe({
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
}