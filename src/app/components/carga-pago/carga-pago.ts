import { Component, inject, ChangeDetectorRef, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColegioServ } from '../../services/colegio-serv';
import { FacturaService } from '../../services/factura-service';
import { PeriodoService } from '../../services/periodo-service';
import { 
  HistoriaFacturacionDto, 
  FacturaDetalleDto, 
  LineaDetalleDto 
} from '../../models/colegio.models';

@Component({
  selector: 'app-carga-pago',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carga-pago.html',
  styleUrls: ['./carga-pago.scss']
})
export class CargaPagoComponent implements OnInit {
  private service = inject(ColegioServ);
  private facturaService = inject(FacturaService);
  private periodoService = inject(PeriodoService);
  private cdr = inject(ChangeDetectorRef);

  // 🌟 NUEVO: Señal para el dropdown
  periodosDisponibles = signal<any[]>([]);
  periodoSeleccionado: string = ''; // Este será tu filtro

  // Variables de estado necesarias
  legajo: number | undefined = undefined;
  movimientos: HistoriaFacturacionDto | null = null;
  facturaSeleccionada: FacturaDetalleDto | null = null;
  lineasDetalle: LineaDetalleDto[] = [];
  totalDeudaFinal = 0;

  // 🔎 Búsqueda por Apellido y Nombre con autocompletado (unificada con legajo)
  nombreAlumno: string = '';
  resultadosBusqueda: any[] = [];
  mostrarSugerencias = false;
  indiceSugerenciaActiva = -1;
  
  cargando = false;
  cargandoDetalle = false;
  cargandoPago = false;
  
  // Variables para el registro de pagos
  importePago: number | null = null;

  mostrarCartel = false;
tituloCartel = '';
mensajeCartel = '';
esConfirmacion = false;
accionPendiente: () => void = () => {};

  ngOnInit() {
    this.cargarPeriodos();
  }

  cargarPeriodos() {
    this.periodoService.getPeriodosHistoricos().subscribe({
      next: (res: any) => {
        const lista = res?.content || res || [];
        this.periodosDisponibles.set(lista);
        if (lista.length > 0) this.periodoSeleccionado = lista[0].descripcion;
        this.cdr.detectChanges();
      }
    });
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

  // Al hacer clic (o Enter) en un resultado: fija el legajo y dispara la consulta
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
consultarCuenta() {
  if (!this.legajo || !this.periodoSeleccionado) {
    alert("Por favor, ingrese legajo y seleccione un período.");
    return;
  }

  this.cargando = true;
  this.movimientos = null;
  this.facturaSeleccionada = null;
  this.totalDeudaFinal = 0;

  // CAMBIO: Ahora usamos getCuentaCorriente para traer TODO el historial
  this.facturaService.getCuentaCorriente(this.legajo).subscribe({
    next: (historial: any) => {
      // Si el backend devuelve un array, tomamos el primero, si es objeto, lo usamos directo
      const data = Array.isArray(historial) ? historial[0] : historial;
      

      if (!data || !data.facturas) {
        alert("No se encontraron movimientos para este legajo.");
        this.cargando = false;
        return;
      }

      let acumulado = 0;
      const facturasFiltradas = data.facturas
        .filter((f: any) => f.periodo === this.periodoSeleccionado)
        .map((f: any) => {
          // 2. Calculamos el saldo progresivo igual que en CuentaCorriente
          const debe = f.impAdeudado || 0;
          const haber = f.impPagado || 0;
          acumulado += (debe - haber);
          return { ...f, saldoProgresivo: acumulado };
        });

      this.totalDeudaFinal = acumulado;

      // 2. Buscamos el nombre del alumno (Tu lógica intacta)
      this.service.getAlumnoPorLegajo(this.legajo!).subscribe({
        next: (alumnoData: any) => {
          console.log("Datos del alumno recibidos:", alumnoData);
          
          const nombreFinal = alumnoData.nombreCompleto || 
                              alumnoData.apellido + ', ' + alumnoData.nombre || 
                              alumnoData.nombre || 
                              'Alumno sin nombre';

          this.movimientos = {
            legajo: this.legajo!,
            nombreCompleto: nombreFinal,
           facturas: facturasFiltradas // Aquí están todas, pagadas y no pagadas
          } as HistoriaFacturacionDto;

          this.nombreAlumno = nombreFinal; // 🔗 Sincroniza el campo de nombre con el legajo consultado
          
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    },
    error: (err) => {
      console.error("Error al cargar historial:", err);
      this.cargando = false;
      this.cdr.detectChanges();
    }
  });
}

seleccionarFactura(f: any) {
  if (this.facturaSeleccionada?.nroFactura === f.nroFactura) {
    this.facturaSeleccionada = null;
    this.lineasDetalle = [];
    this.importePago = null;
    return;
  }

  this.facturaSeleccionada = f;
  this.cargandoDetalle = true;
  this.lineasDetalle = []; 
  this.importePago = f.saldoProgresivo;

  this.facturaService.getDetalleFactura(f.nroFactura).subscribe({
    next: (data: any) => {
      // 🌟 FILTRO ACTIVO: Solo mostramos las líneas cuyo período coincida con el seleccionado
      const todosLosDetalles = Array.isArray(data) ? data : (data?.detalles || []);
      
      this.lineasDetalle = todosLosDetalles.filter((linea: any) => 
        linea.periodo === this.periodoSeleccionado
      );
      
      this.cargandoDetalle = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error("Error al traer el detalle:", err);
      this.lineasDetalle = [];
      this.cargandoDetalle = false;
      this.cdr.detectChanges();
    }
  });
}

  registrarPago() {
    if (!this.legajo || !this.facturaSeleccionada || !this.importePago || this.importePago <= 0) {
     this.abrirCartel('Atención', 'Ingrese un importe válido.');
    return;
    }

    this.cargandoPago = true;
    const payload = {
      legajo: this.legajo,
      nroFactura: this.facturaSeleccionada.nroFactura,
      fechaPago: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
      importePagado: this.importePago,
      tipoPagoId: 1 // Ajusta según tu lógica de medio de pago
    };

    this.facturaService.registrarPago(payload).subscribe({
      next: () => {
        this.cargandoPago = false;
        this.importePago = null;
        this.consultarCuenta(); // Refresca la grilla
        this.abrirCartel('Éxito', 'Pago registrado correctamente.');
      },
      error: (err) => {
        console.error("Error al registrar pago:", err);
        alert("Error al procesar el pago.");
        this.cargandoPago = false;
      }
    });
  }

anularPago(nroFactura: number) {
  this.abrirCartel('Confirmar Anulación', '¿Está seguro de que desea anular este pago?', true, () => {
    this.facturaService.anularPago(nroFactura).subscribe({
      next: () => {
        this.consultarCuenta();
        this.abrirCartel('Éxito', 'El pago ha sido anulado correctamente.');
      },
      error: () => this.abrirCartel('Error', 'No se pudo anular el pago.')
    });
  });
}

  abrirCartel(titulo: string, mensaje: string, confirmacion = false, callback?: () => void) {
  this.tituloCartel = titulo;
  this.mensajeCartel = mensaje;
  this.esConfirmacion = confirmacion;
  this.accionPendiente = callback || (() => {});
  this.mostrarCartel = true;
}

cerrarCartel() {
  this.mostrarCartel = false;
}

ejecutarAccionConfirmada() {
  this.accionPendiente();
  this.cerrarCartel();
}
}