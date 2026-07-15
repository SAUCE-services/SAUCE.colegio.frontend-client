import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColegioServ } from '../../services/colegio-serv';
import { FacturaService } from '../../services/factura-service';
import { HistoriaFacturacionDto, FacturaDetalleDto, LineaDetalleDto } from '../../models/colegio.models';

@Component({
  selector: 'app-historia-facturacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historia-facturacion.html',
  styleUrl: './historia-facturacion.scss'
})
export class HistoriaFacturacionComponent {
  private service = inject(ColegioServ);
  private facturaService = inject(FacturaService);
  private cdr = inject(ChangeDetectorRef);

  // 🔎 Búsqueda por legajo o por nombre (con autocompletado)
  legajo: number | null = null;
  nombreAlumno: string = '';
  resultadosBusqueda: any[] = [];
  mostrarSugerencias = false;
  indiceSugerenciaActiva = -1;

  movimientos: HistoriaFacturacionDto | null = null;
  facturaSeleccionada: FacturaDetalleDto | null = null;
  lineasDetalle: LineaDetalleDto[] = [];
  cargando = false;
  cargandoDetalle = false;
  totalDeudaFinal = 0;
  anulando = false;

  // 🌟 Cartel de confirmación/alerta custom
  mostrarCartelMensaje = false;
  cartelTipo: 'pregunta' | 'alerta' = 'alerta';
  cartelTitulo: string = '';
  cartelMensaje: string = '';
  facturaPendienteAnular: any = null;

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

  // Se llama exclusivamente al presionar Enter en el campo Legajo
  async onEnterLegajo() {
    if (this.legajo) {
      await this.buscarPorLegajoPromise();
    }
    this.consultarCuenta();
  }

  // Al hacer clic en un resultado del dropdown
  seleccionarAlumno(alumno: any) {
    this.legajo = alumno.alumnoId;
    this.nombreAlumno = alumno.nombreCompleto;
    this.resultadosBusqueda = [];
    this.mostrarSugerencias = false;
    this.indiceSugerenciaActiva = -1;
    this.consultarCuenta();
  }

  // Maneja flechas ↑↓ para navegar sugerencias, Enter para confirmar y Escape para cerrar
  manejarTecladoSugerencias(event: KeyboardEvent) {
    if (!this.mostrarSugerencias || this.resultadosBusqueda.length === 0) {
      if (event.key === 'Enter') {
        this.consultarCuenta();
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
          this.consultarCuenta();
        }
        break;

      case 'Escape':
        this.mostrarSugerencias = false;
        this.indiceSugerenciaActiva = -1;
        break;
    }
  }

  // Buscar directo por legajo (blur del campo)
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

  buscarPorNombrePromise(): Promise<void> {
    return new Promise((resolve) => {
      this.service.buscarAlumnos(this.nombreAlumno).subscribe({
        next: (data: any[]) => {
          if (data && data.length > 0) {
            this.legajo = data[0].alumnoId;
            this.nombreAlumno = data[0].nombreCompleto;
          }
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  // 🌟 Trae TODA la historia de facturación del alumno (no solo un período)
  async consultarCuenta() {
    this.cargando = true;

    if (this.nombreAlumno && !this.legajo) {
      await this.buscarPorNombrePromise();
    } else if (this.legajo && !this.nombreAlumno) {
      await this.buscarPorLegajoPromise();
    }
    if (!this.legajo) {
      this.cargando = false;
      return;
    }

    this.facturaSeleccionada = null;
    this.movimientos = null;
    this.totalDeudaFinal = 0;
    this.cdr.detectChanges();

    this.facturaService.getCuentaCorriente(this.legajo).subscribe({
      next: (data: any) => {
        const historial: HistoriaFacturacionDto = Array.isArray(data) ? data[0] : data;
        if (historial && historial.facturas) {
          let acumulado = 0;
          const facturasProcesadas: FacturaDetalleDto[] = historial.facturas.map(f => {
            const debe = f.impAdeudado || 0;
            const haber = f.impPagado || 0;
            acumulado += (debe - haber);
            return { ...f, saldoProgresivo: acumulado };
          });
          this.movimientos = { ...historial, facturas: facturasProcesadas };
          this.totalDeudaFinal = acumulado;
        } else {
          this.lanzarCartel('Sin Registros', 'El alumno no tiene movimientos registrados en este legajo.', 'alerta');
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error en la petición:", err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Expande/colapsa el detalle de conceptos de una factura
  seleccionarFactura(f: FacturaDetalleDto) {
    if (this.facturaSeleccionada?.nroFactura === f.nroFactura) {
      this.facturaSeleccionada = null;
      this.lineasDetalle = [];
      return;
    }
    this.facturaSeleccionada = f;
    this.lineasDetalle = [];
    this.cargandoDetalle = true;
    this.facturaService.getDetalleFactura(f.nroFactura).subscribe({
      next: (data: LineaDetalleDto[]) => {
        this.lineasDetalle = data;
        this.cargandoDetalle = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al traer el detalle:", err);
        this.cargandoDetalle = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 🌟 Anular una factura completa (distinto de anular el pago)
  anularFactura(factura: any, event: Event) {
    event.stopPropagation();
    this.facturaPendienteAnular = factura;

    this.cartelTitulo = 'Confirmar Anulación de Factura';
    this.cartelMensaje = `¿Está completamente seguro de que desea anular la Factura Nº ${factura.nroFactura}? Esta acción no se puede deshacer.`;
    this.cartelTipo = 'pregunta';
    this.mostrarCartelMensaje = true;
    this.cdr.detectChanges();
  }

  ejecutarAnulacionConfirmada() {
    this.mostrarCartelMensaje = false;
    if (!this.facturaPendienteAnular) return;

    const factura = this.facturaPendienteAnular;
    this.facturaPendienteAnular = null;
    this.anulando = true;
    this.cdr.detectChanges();

    this.facturaService.anularFactura(factura.nroFactura).subscribe({
      next: () => {
        this.anulando = false;
        this.consultarCuenta();
      },
      error: (err) => {
        this.anulando = false;
        const mensaje = (typeof err?.error === 'string' && err.error.trim())
          ? err.error
          : 'El servidor rechazó la anulación de la factura.';
        this.lanzarCartel('Error', mensaje, 'alerta');
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