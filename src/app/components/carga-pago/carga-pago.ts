import { Component, inject, ChangeDetectorRef, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColegioServ } from '../../services/colegio-serv';
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
  private cdr = inject(ChangeDetectorRef);

  // 🌟 NUEVO: Señal para el dropdown
  periodosDisponibles = signal<any[]>([]);
  periodoSeleccionado: string = ''; // Este será tu filtro

  // Variables de estado necesarias
  legajo: number | undefined = undefined;
  movimientos: HistoriaFacturacionDto | null = null;
  facturaSeleccionada: FacturaDetalleDto | null = null;
  lineasDetalle: LineaDetalleDto[] = [];
  
  cargando = false;
  cargandoDetalle = false;
  cargandoPago = false;
  
  // Variables para el registro de pagos
  importePago: number | null = null;

  ngOnInit() {
    this.cargarPeriodos();
  }

  cargarPeriodos() {
    this.service.getPeriodosHistoricos().subscribe({
      next: (res: any) => {
        const lista = res?.content || res || [];
        this.periodosDisponibles.set(lista);
        if (lista.length > 0) this.periodoSeleccionado = lista[0].descripcion;
        this.cdr.detectChanges();
      }
    });
  }

consultarCuenta() {
  if (!this.legajo || !this.periodoSeleccionado) {
    alert("Por favor, ingrese legajo y seleccione un período.");
    return;
  }

  this.cargando = true;
  this.movimientos = null;
  this.facturaSeleccionada = null;

  // 1. Buscamos la factura específica
  this.service.buscarFacturaParaPago(this.legajo, this.periodoSeleccionado).subscribe({
    next: (facturaData: any) => {
      
      // 2. Buscamos el nombre del alumno a través del servicio de alumnos
      // Esto soluciona que el nombre no aparezca porque no viene en el JSON de factura
      this.service.getAlumnoPorLegajo(this.legajo!).subscribe({
        next: (alumnoData: any) => {
  // 🔍 ESTO NOS DIRÁ EL NOMBRE REAL DE LA PROPIEDAD
  console.log("Datos del alumno recibidos:", alumnoData);
  
  // Probemos con estas variantes, una debería funcionar:
  const nombreFinal = alumnoData.nombreCompleto || 
                      alumnoData.apellido + ', ' + alumnoData.nombre || 
                      alumnoData.nombre || 
                      'Alumno sin nombre';

  this.movimientos = {
    legajo: this.legajo,
    nombreCompleto: nombreFinal,
    facturas: [facturaData]
  } as HistoriaFacturacionDto;

  this.cargando = false;
  this.cdr.detectChanges();
},
        error: () => {
          // Si falla la búsqueda del nombre, mostramos la factura igual
          this.movimientos = {
            legajo: this.legajo,
            nombreCompleto: `Alumno Legajo: ${this.legajo}`,
            facturas: [facturaData]
          } as HistoriaFacturacionDto;
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    },
    error: (err) => {
      console.error("Error al buscar factura:", err);
      alert(err.error?.message || "No se encontró factura para este alumno y período.");
      this.cargando = false;
      this.cdr.detectChanges();
    }
  });
}

seleccionarFactura(f: FacturaDetalleDto) {
  // Si ya estaba abierta, la cerramos
  if (this.facturaSeleccionada?.nroFactura === f.nroFactura) {
    this.facturaSeleccionada = null;
    this.lineasDetalle = [];
    return;
  }

  // Si no, la seleccionamos y pedimos el detalle
  this.facturaSeleccionada = f;
  this.cargandoDetalle = true;
  this.lineasDetalle = []; // Limpiamos previo para evitar mostrar datos viejos

  this.service.getDetalleFactura(f.nroFactura).subscribe({
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

  registrarPago() {
    if (!this.legajo || !this.facturaSeleccionada || !this.importePago || this.importePago <= 0) {
      alert("Ingrese un importe válido.");
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

    this.service.registrarPago(payload).subscribe({
      next: () => {
        this.cargandoPago = false;
        this.importePago = null;
        this.consultarCuenta(); // Refresca la grilla
      },
      error: (err) => {
        console.error("Error al registrar pago:", err);
        alert("Error al procesar el pago.");
        this.cargandoPago = false;
      }
    });
  }

  anularPago(nroFactura: number) {
    if (!confirm("¿Está seguro de que desea anular este pago?")) return;
    
    this.service.anularPago(nroFactura).subscribe({
      next: () => {
        this.consultarCuenta(); // Refresca la grilla
      },
      error: (err) => {
        console.error("Error al anular pago:", err);
        alert("Error al anular el pago.");
      }
    });
  }
}