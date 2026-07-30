import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { ColegioServ } from '../../services/colegio-serv';
import { FacturaService } from '../../services/factura-service';
import { HistoriaFacturacionDto, FacturaDetalleDto, LineaDetalleDto, DeudaIndividualResponseDto, AlumnoDto } from '../../models/colegio.models'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-deuda-indivual',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deuda-individual.html',
  styleUrl: './deuda-individual.scss'
})
export class DeudaIndividualComponent {
  private service = inject(ColegioServ);
  private facturaService = inject(FacturaService);
  private cdr = inject(ChangeDetectorRef);

  legajo: number | null = null;
  nombreAlumno: string = ''; // Nueva propiedad para el nombre
  resultadosBusqueda: any[] = [];
  mostrarSugerencias = false;
  indiceSugerenciaActiva = -1; // Índice de la sugerencia resaltada con el teclado

  movimientos: HistoriaFacturacionDto | null = null;
  facturaSeleccionada: FacturaDetalleDto | null = null;
  lineasDetalle: LineaDetalleDto[] = [];
  cargando = false;
  totalDeudaFinal = 0;
  cargandoDetalle = false;

  // VARIABLES MODAL DEUDAS
  mostrarModalDeudas = false;
  cargandoDeudaModal = false;
  reporteDeudaIndividual: DeudaIndividualResponseDto | null = null;

  // 🌟 VARIABLES PARA EL CARTEL DE ALERTA CUSTOM
  mostrarCartelMensaje = false;
  cartelTipo: 'pregunta' | 'alerta' = 'alerta';
  cartelTitulo: string = '';
  cartelMensaje: string = '';

  // Método disparado con (input)
buscarEnTiempoReal() {
  this.indiceSugerenciaActiva = -1; // Reinicia el resaltado en cada nueva búsqueda

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
    await this.buscarPorLegajoPromise(); // siempre sincroniza el nombre con el legajo actual
  }
  this.consultarCuenta();
}

// Al hacer clic en un resultado
seleccionarAlumno(alumno: any) {
  this.legajo = alumno.alumnoId;
  this.nombreAlumno = alumno.nombreCompleto;
  this.resultadosBusqueda = [];
  this.mostrarSugerencias = false;
  this.indiceSugerenciaActiva = -1;
  this.consultarCuenta(); // Dispara la consulta inmediatamente al elegir
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

  // Método para buscar por nombre (puedes usar el servicio que ya tienes)
  buscarPorNombre() {
    if (this.nombreAlumno.length < 3) return;
    this.service.buscarAlumnos(this.nombreAlumno).subscribe((data: AlumnoDto[]) => {
      if (data && data.length > 0) {
        this.legajo = data[0].alumnoId;
        this.nombreAlumno = data[0].nombreCompleto;
      }
    });
  }
// Método para buscar por legajo (se mantiene el original)
  buscarPorLegajo() {
    if (!this.legajo) return;
      this.service.getAlumnoPorLegajo(this.legajo).subscribe((data: any) => {
      this.nombreAlumno = `${data.apellido}, ${data.nombre}`;
    });
  }

  abrirModalDeudas() {
    if (!this.legajo) return;
    this.mostrarModalDeudas = true;
    this.cargandoDeudaModal = true;
    this.reporteDeudaIndividual = null;
    this.cdr.detectChanges();

    this.facturaService.getDeudaIndividual(this.legajo).subscribe({
      next: (data: any) => {
        if (data) {
          const listaCruda = data.detalles || [];
          const detallesProcesados = listaCruda.map((d: any) => ({
            fechaEstado: d.fechaEstado || d.fecha_estado,
            concepto: d.concepto || d.nombre || 'Cuota / Concepto Base',
            estado: d.estado || 'EXIGIBLE',
            fechaRegistro: d.fechaRegistro || d.fecha_registro,
            importe: Number(d.importe != null ? d.importe : 0)
          }));
          const totalMapeado = data.totalDeuda != null ? data.totalDeuda :
                                detallesProcesados.reduce((acc: number, item: any) => acc + item.importe, 0);
          this.reporteDeudaIndividual = {
            detalles: detallesProcesados,
            totalDeuda: totalMapeado
          };
        } else {
          this.reporteDeudaIndividual = { detalles: [], totalDeuda: 0 };
        }
        this.cargandoDeudaModal = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al interceptar el endpoint de deudas individuales:", err);
        this.reporteDeudaIndividual = { detalles: [], totalDeuda: 0 };
        this.cargandoDeudaModal = false;
        this.cdr.detectChanges();
      }
    });
  }
descargarPdfDeuda() {
  if (!this.legajo) return;

  this.facturaService.descargarPdfDeudaIndividual(this.legajo).subscribe({
    next: (blob: Blob) => {
      // 🌟 Crear una URL para el blob
      const url = window.URL.createObjectURL(blob);
      
      // 🌟 Abrir en una nueva pestaña para previsualización
      const nuevaVentana = window.open(url, '_blank');
      
      // Si el navegador bloquea la ventana emergente, podrías optar por:
      if (!nuevaVentana) {
        alert("Por favor, permite las ventanas emergentes para ver el PDF.");
      }
      
      // Opcional: revocar la URL después de un tiempo para liberar memoria
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    },
    error: (err) => console.error("Error al generar el PDF de deuda:", err)
  });
}

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

  async consultarCuenta() {
    this.cargando = true;
    
    if (this.nombreAlumno && !this.legajo) {
    await this.buscarPorNombrePromise();
  } else if (this.legajo && !this.nombreAlumno) {
    await this.buscarPorLegajoPromise();
  }
    if (!this.legajo) return;
    this.facturaSeleccionada = null;
    this.cargando = true;
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
          this.cartelTipo = 'alerta';
          this.cartelTitulo = 'Sin Registros';
          this.cartelMensaje = 'El alumno no tiene movimientos registrados en este legajo.';
          this.mostrarCartelMensaje = true;
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error en la petición:", err);
        this.cargando = false;
        this.cdr.detectChanges();
        alert('Error al conectar con el servidor.');
      }
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

}