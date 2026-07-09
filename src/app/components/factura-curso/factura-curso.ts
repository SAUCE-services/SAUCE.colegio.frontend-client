import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColegioServ } from '../../services/colegio-serv';
import { FacturaService } from '../../services/factura-service';
import { PeriodoService } from '../../services/periodo-service';

@Component({
  selector: 'app-factura-curso',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './factura-curso.html',
  styleUrl: './factura-curso.scss'
})
export class FacturaCursoComponent implements OnInit {
  private service = inject(ColegioServ);
  private facturaService = inject(FacturaService);
  private periodoService = inject(PeriodoService);
  private cdr = inject(ChangeDetectorRef);

  ciclosDisponibles: string[] = [];
  cursosCombo: any[] = [];
  periodosCombo: any[] = [];

  cicloSeleccionado: string = '';
  cursoSeleccionadoId: number | null = null;
  periodoSeleccionadoId: number | null = null;
  fechaVencimiento: string = ''; // yyyy-MM-dd, formato nativo del <input type="date">

  cargandoPreview = false;
  facturando = false;
  imprimiendo = false;
  preview: any[] = []; // 🌟 TODOS los alumnos del curso, con facturado true/false

  // 🌟 Sistema de cartel custom (mismo patrón que el resto de la app)
  mostrarCartelMensaje = false;
  cartelTitulo = '';
  cartelMensaje = '';
  cartelTipo: 'exito' | 'error' = 'exito';

  ngOnInit(): void {
    this.service.getCiclosDisponibles().subscribe({
      next: (ciclos) => {
        this.ciclosDisponibles = ciclos || [];
        const anioActual = new Date().getFullYear().toString();
        this.cicloSeleccionado = (ciclos && ciclos.includes(anioActual))
          ? anioActual
          : (ciclos && ciclos.length > 0 ? ciclos[0] : '');

        if (this.cicloSeleccionado) {
          this.onCambioCiclo();
        }
        this.cdr.detectChanges();
      }
    });
  }

  // Al cambiar el Ciclo, recargamos los combos de Curso y Período que dependen de él
  onCambioCiclo() {
    this.cursoSeleccionadoId = null;
    this.periodoSeleccionadoId = null;
    this.preview = [];
    this.cursosCombo = [];
    this.periodosCombo = [];

    if (!this.cicloSeleccionado) {
      return;
    }

    this.service.getCursosComboPorCiclo(this.cicloSeleccionado).subscribe({
      next: (cursos: any[]) => {
        this.cursosCombo = cursos || [];
        this.cdr.detectChanges();
      }
    });

    this.periodoService.getPeriodosComboPorCiclo(this.cicloSeleccionado).subscribe({
      next: (periodos: any[]) => {
        this.periodosCombo = periodos || [];
        if (this.periodosCombo.length > 0) {
          this.periodoSeleccionadoId = this.periodosCombo[0].periodoId;
          this.cargarPreview();
        }
        this.cdr.detectChanges();
      }
    });
  }

  // Se llama al cambiar Curso o Período: dispara la vista previa automáticamente
  onCambioSeleccion() {
    this.cargarPreview();
  }

  // 🌟 Trae TODOS los alumnos del curso, marcados como facturado (rojo) o pendiente (verde)
  cargarPreview() {
    if (!this.cursoSeleccionadoId || !this.periodoSeleccionadoId) {
      this.preview = [];
      return;
    }

    this.cargandoPreview = true;
    this.cdr.detectChanges();

    this.facturaService.previewFacturaCurso(this.cursoSeleccionadoId, this.periodoSeleccionadoId).subscribe({
      next: (res: any[]) => {
        this.preview = res || [];
        this.cargandoPreview = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoPreview = false;
        const mensaje = (typeof err?.error === 'string' && err.error.trim())
          ? err.error
          : 'No se pudo cargar la vista previa del curso.';
        this.lanzarCartel('Error', mensaje, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // Cuántos alumnos de la vista previa tienen conceptos sin facturar (para habilitar el botón).
  get hayPendientes(): boolean {
    return this.preview.some(a => a.tienePendientes);
  }

  // Si hay al menos un alumno ya facturado, se puede imprimir el PDF del curso
  get hayFacturados(): boolean {
    return this.preview.some(a => a.facturado);
  }

  imprimir() {
    if (!this.cursoSeleccionadoId || !this.periodoSeleccionadoId) {
      return;
    }

    this.imprimiendo = true;
    this.cdr.detectChanges();

    this.facturaService.imprimirFacturaCurso(this.cursoSeleccionadoId, this.periodoSeleccionadoId).subscribe({
      next: (blob: Blob) => {
        this.imprimiendo = false;
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        this.cdr.detectChanges();
      },
      error: async (err) => {
        this.imprimiendo = false;
        // El error viene como Blob (responseType: 'blob'), hay que leerlo como texto
        let mensaje = 'No se pudo generar el PDF.';
        if (err?.error instanceof Blob) {
          try {
            mensaje = await err.error.text();
          } catch { /* usamos el mensaje genérico */ }
        }
        this.lanzarCartel('Error', mensaje, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  facturar() {
    if (!this.cursoSeleccionadoId || !this.periodoSeleccionadoId || !this.fechaVencimiento) {
      this.lanzarCartel('Atención', 'Complete Curso, Período y Vencimiento antes de facturar.', 'error');
      return;
    }

    this.facturando = true;
    this.cdr.detectChanges();

    this.facturaService.facturarCurso({
      cursoId: this.cursoSeleccionadoId,
      periodoId: this.periodoSeleccionadoId,
      fechaVencimiento: this.fechaVencimiento
    }).subscribe({
      next: (res: any[]) => {
        this.facturando = false;
        const cantidad = res?.length || 0;

        if (cantidad === 0) {
          this.lanzarCartel(
            'Sin novedades',
            'No había conceptos pendientes de facturar para este curso y período.',
            'error'
          );
        } else {
          this.lanzarCartel('Facturación exitosa', `Se generaron ${cantidad} facturas nuevas.`, 'exito');
        }

        // 🌟 Refrescamos la vista previa para que los recién facturados pasen a rojo
        this.cargarPreview();
      },
      error: (err) => {
        this.facturando = false;
        const mensaje = (typeof err?.error === 'string' && err.error.trim())
          ? err.error
          : 'No se pudo facturar el curso. Intente nuevamente.';
        this.lanzarCartel('Error', mensaje, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  private lanzarCartel(titulo: string, mensaje: string, tipo: 'exito' | 'error') {
    this.cartelTitulo = titulo;
    this.cartelMensaje = mensaje;
    this.cartelTipo = tipo;
    this.mostrarCartelMensaje = true;
  }
}