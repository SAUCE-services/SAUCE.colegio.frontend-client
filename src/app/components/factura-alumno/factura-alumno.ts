import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColegioServ } from '../../services/colegio-serv';
import { FacturaService } from '../../services/factura-service';
import { PeriodoService } from '../../services/periodo-service';

@Component({
  selector: 'app-factura-alumno',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './factura-alumno.html',
  styleUrl: './factura-alumno.scss'
})
export class FacturaAlumnoComponent implements OnInit {
  private service = inject(ColegioServ);
  private facturaService = inject(FacturaService);
  private periodoService = inject(PeriodoService);
  private cdr = inject(ChangeDetectorRef);

  // 🔎 Búsqueda de alumno: por legajo O por nombre con autocompletado
  legajoBusqueda: number | null = null;
  nombreBusqueda: string = '';
  resultadosBusqueda: any[] = [];
  mostrarSugerencias = false;
  indiceSugerenciaActiva = -1;

  alumnoSeleccionado: { alumnoId: number; nombreCompleto: string } | null = null;

  // Período (sin selector de Ciclo, igual que el resto de las pantallas de este estilo)
  periodosCombo: any[] = [];
  periodoSeleccionadoId: number | null = null;

  fechaVencimiento: string = ''; // yyyy-MM-dd
  recargo: number | null = null;

  cargandoPreview = false;
  facturando = false;
  imprimiendo = false;
  preview: any = null; // vista previa del alumno seleccionado (facturado/pendiente + conceptos)

  // 🌟 Cartel custom (mismo patrón que el resto de la app)
  mostrarCartelMensaje = false;
  cartelTitulo = '';
  cartelMensaje = '';
  cartelTipo: 'exito' | 'error' = 'exito';

  ngOnInit(): void {
    this.periodoService.getPeriodosHistoricos().subscribe({
      next: (res: any) => {
        const lista = res?.content || res || [];
        this.periodosCombo = lista;
        if (lista.length > 0) {
          this.periodoSeleccionadoId = lista[0].periodoId;
        }
        this.cdr.detectChanges();
      }
    });
  }

  onCambioPeriodo() {
    this.cargarPreview();
  }

  // Total de los conceptos todavía sin facturar (lo que se facturaría al tocar FACTURAR)
  get totalPendientes(): number {
    if (!this.preview?.conceptos) return 0;
    return this.preview.conceptos
      .filter((c: any) => c.estado === 'PENDIENTE DE FACTURAR')
      .reduce((acc: number, c: any) => acc + (c.importe || 0), 0);
  }

  // Búsqueda en tiempo real por Apellido y Nombre
  buscarEnTiempoReal() {
    this.indiceSugerenciaActiva = -1;

    if (this.nombreBusqueda.length < 3) {
      this.resultadosBusqueda = [];
      this.mostrarSugerencias = false;
      return;
    }

    this.service.buscarAlumnos(this.nombreBusqueda).subscribe(data => {
      this.resultadosBusqueda = data;
      this.mostrarSugerencias = data.length > 0;
      this.indiceSugerenciaActiva = -1;
    });
  }

  // Al hacer clic (o Enter) en un resultado del dropdown
  seleccionarAlumno(alumno: any) {
    this.legajoBusqueda = alumno.alumnoId;
    this.nombreBusqueda = alumno.nombreCompleto;
    this.resultadosBusqueda = [];
    this.mostrarSugerencias = false;
    this.indiceSugerenciaActiva = -1;
    this.confirmarAlumno();
  }

  // Maneja flechas ↑↓, Enter y Escape en el dropdown de sugerencias
  manejarTecladoSugerencias(event: KeyboardEvent) {
    if (!this.mostrarSugerencias || this.resultadosBusqueda.length === 0) {
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
        if (this.resultadosBusqueda.length > 0) {
          const indice = this.indiceSugerenciaActiva >= 0 ? this.indiceSugerenciaActiva : 0;
          this.seleccionarAlumno(this.resultadosBusqueda[indice]);
        }
        break;

      case 'Escape':
        this.mostrarSugerencias = false;
        this.indiceSugerenciaActiva = -1;
        break;
    }
  }

  // Buscar directo por legajo (Enter o botón)
  buscarPorLegajo() {
    if (!this.legajoBusqueda) return;

    this.service.getAlumnoPorId(this.legajoBusqueda).subscribe({
      next: (alumno: any) => {
        this.nombreBusqueda = `${alumno.apellido}, ${alumno.nombre}`;
        this.confirmarAlumno();
      },
      error: () => {
        this.alumnoSeleccionado = null;
        this.preview = null;
        this.lanzarCartel('No encontrado', 'No se encontró un alumno con ese legajo.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  private confirmarAlumno() {
    if (!this.legajoBusqueda) return;
    this.alumnoSeleccionado = { alumnoId: this.legajoBusqueda, nombreCompleto: this.nombreBusqueda };
    this.cargarPreview();
  }

  // 🌟 Trae el estado (facturado/pendiente) y el detalle de conceptos del alumno elegido
  cargarPreview() {
    if (!this.alumnoSeleccionado || !this.periodoSeleccionadoId) {
      this.preview = null;
      return;
    }

    this.cargandoPreview = true;
    this.cdr.detectChanges();

    this.facturaService.previewFacturaAlumno(this.alumnoSeleccionado.alumnoId, this.periodoSeleccionadoId).subscribe({
      next: (res) => {
        this.preview = res;
        this.cargandoPreview = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoPreview = false;
        const mensaje = (typeof err?.error === 'string' && err.error.trim())
          ? err.error
          : 'No se pudo cargar la vista previa del alumno.';
        this.lanzarCartel('Error', mensaje, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  facturar() {
    if (!this.alumnoSeleccionado || !this.periodoSeleccionadoId || !this.fechaVencimiento) {
      this.lanzarCartel('Atención', 'Busque un alumno, y complete Período y Vencimiento antes de facturar.', 'error');
      return;
    }

    this.facturando = true;
    this.cdr.detectChanges();

    this.facturaService.facturarAlumno({
      alumnoId: this.alumnoSeleccionado.alumnoId,
      periodoId: this.periodoSeleccionadoId,
      fechaVencimiento: this.fechaVencimiento,
      recargo: this.recargo ?? undefined
    }).subscribe({
      next: (res: any) => {
        this.facturando = false;
        this.lanzarCartel(
          'Facturación exitosa',
          `Se generó la Factura Nº ${res.nroFactura} por un total de ${res.importeTotal}.`,
          'exito'
        );
        this.recargo = null;
        this.cargarPreview();
      },
      error: (err) => {
        this.facturando = false;
        const mensaje = (typeof err?.error === 'string' && err.error.trim())
          ? err.error
          : 'No se pudo facturar al alumno. Intente nuevamente.';
        this.lanzarCartel('Error', mensaje, 'error');
        this.cdr.detectChanges();
      }
    });
  }

  imprimir() {
    if (!this.alumnoSeleccionado || !this.periodoSeleccionadoId) return;

    this.imprimiendo = true;
    this.cdr.detectChanges();

    this.facturaService.imprimirFacturaAlumno(this.alumnoSeleccionado.alumnoId, this.periodoSeleccionadoId).subscribe({
      next: (blob: Blob) => {
        this.imprimiendo = false;
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        this.cdr.detectChanges();
      },
      error: async (err) => {
        this.imprimiendo = false;
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

  private lanzarCartel(titulo: string, mensaje: string, tipo: 'exito' | 'error') {
    this.cartelTitulo = titulo;
    this.cartelMensaje = mensaje;
    this.cartelTipo = tipo;
    this.mostrarCartelMensaje = true;
  }
}