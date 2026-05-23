import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { ColegioServ } from '../../services/colegio-serv';
import { HistoriaFacturacionDto, FacturaDetalleDto, LineaDetalleDto, DeudaIndividualResponseDto, NovedadesAlumnoResponseDto, NovedadCargaDto } from '../../models/colegio.models'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cuenta-corriente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cuenta-corriente.html',
  styleUrl: './cuenta-corriente.scss'
})
export class CuentaCorrienteComponent {
  private service = inject(ColegioServ);
  private cdr = inject(ChangeDetectorRef);
  
  legajo: number | null = null;
  movimientos: HistoriaFacturacionDto | null = null;
  facturaSeleccionada: FacturaDetalleDto | null = null;
  lineasDetalle: LineaDetalleDto[] = [];
  cargando = false;
  totalDeudaFinal = 0;
  cargandoDetalle = false;

  // VARIABLES MODAL NOVEDADES
  mostrarModalNovedades = false;
  cargandoNovedades = false;
  reporteNovedades: NovedadesAlumnoResponseDto | null = null;

  // VARIABLES MODAL DEUDAS
  mostrarModalDeudas = false;
  cargandoDeudaModal = false;
  reporteDeudaIndividual: DeudaIndividualResponseDto | null = null;

  // 🌟 NUEVAS VARIABLES PARA EL FILTRO REACTIVO
  periodoFiltro: string = ''; 
  periodosDisponibles: string[] = []; // Se poblará con descripciones reales (ej: "MAYO - 2026")

  // VARIABLES PARA EL FORMULARIO DE CARGA MANUAL
  mostrarFormularioAlta = false;
  guardandoNovedad = false;
  
  conceptoSeleccionadoId: number | null = null;
  importeNovedad: number | null = null;

  // 🌟 LISTA DINÁMICA: Se llenará con los conceptos reales de la Base de Datos
  conceptosDisponibles: any[] = [];

  abrirModalDeudas() {
    if (!this.legajo) return;
    this.mostrarModalDeudas = true;
    this.cargandoDeudaModal = true;
    this.reporteDeudaIndividual = null;
    this.cdr.detectChanges(); 

    this.service.getDeudaIndividual(this.legajo).subscribe({
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
    this.service.descargarPdfDeudaIndividual(this.legajo).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `deuda_individual_${this.legajo}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error("Error al descargar el PDF de deuda:", err)
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

  consultarCuenta() {
    if (!this.legajo) return;
    this.facturaSeleccionada = null;
    this.cargando = true;
    this.movimientos = null; 
    this.totalDeudaFinal = 0;
    this.cdr.detectChanges();

    this.service.getCuentaCorriente(this.legajo).subscribe({
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
          alert('El alumno no tiene movimientos registrados');
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

  // 🌟 PROPIEDAD COMPUTADA: Filtra la lista en caliente según el combo
  get novedadesFiltradas() {
    if (!this.reporteNovedades || !this.reporteNovedades.novedades) return [];
    if (!this.periodoFiltro) return this.reporteNovedades.novedades; // "Todos"
    
    return this.reporteNovedades.novedades.filter(n => n.nombrePeriodo === this.periodoFiltro);
  }

abrirModalNovedades() {
    if (!this.legajo) {
      alert("Por favor, ingrese un legajo primero.");
      return;
    }
    
    this.mostrarModalNovedades = true;
    this.cargandoNovedades = true;
    this.reporteNovedades = null;
    this.cdr.detectChanges();

    // 1️⃣ PASO 1: Traemos todos los períodos reales cargados en la base de datos
    this.service.getPeriodosHistoricos().subscribe({
      next: (res: any) => {
        // Tu controlador devuelve una Page<PeriodoDto>, la lista real está en '.content'
        const listaPeriodos = res?.content || [];
        
        if (listaPeriodos.length > 0) {
          // Extraemos la propiedad 'descripcion' de cada periodo mapeado en el Back
          this.periodosDisponibles = listaPeriodos.map((p: any) => p.descripcion);
          
          // Establecemos por defecto el primer período de la lista (el más nuevo por el orden desc del controlador)
          this.periodoFiltro = this.periodosDisponibles[0];
          
          // 2️⃣ PASO 2: Ya con el período seleccionado, buscamos las novedades específicas de ese mes
          this.cargarNovedadesDelServidor();
        } else {
          // Fallback por si la tabla periodos está vacía
          this.periodosDisponibles = ['MAYO - 2026'];
          this.periodoFiltro = 'MAYO - 2026';
          this.cargarNovedadesDelServidor();
        }
      },
      error: (err) => {
        console.error("Error al recuperar el listado de periodos del backend:", err);
        this.periodosDisponibles = ['MAYO - 2026'];
        this.periodoFiltro = 'MAYO - 2026';
        this.cargarNovedadesDelServidor();
      }
    });
  }

  cargarNovedadesDelServidor() {
    if (!this.legajo || !this.periodoFiltro) return;
    
    this.cargandoNovedades = true;
    this.cdr.detectChanges();

    // Invocamos tu controlador pasándole el periodoNombre exacto que exige el RequestParam
    this.service.getNovedadesPorAlumno(this.legajo, this.periodoFiltro).subscribe({
      next: (data: any) => {
        if (data) {
          // Tu DTO NovedadesAlumnoResponseDto.java de Spring Boot procesa 'detallesGrilla'
          const listaCruda = data.detallesGrilla || []; 
          
          const novedadesProcesadas = listaCruda.map((n: any) => {
            const rawFecha = n.fechaRegistro || n.fecha_registro || null;
            let fechaLimpia = rawFecha;
            
            if (rawFecha && typeof rawFecha === 'string' && rawFecha.includes('T')) {
              const soloFecha = rawFecha.split('T')[0];
              const partes = soloFecha.split('-');
              if (partes.length === 3) {
                fechaLimpia = `${partes[2]}/${partes[1]}/${partes[0]}`;
              }
            }

            return {
              nombreConcepto: n.concepto || n.nombreConcepto || '',
              nombrePeriodo: n.periodo || n.nombrePeriodo || this.periodoFiltro,
              fechaRegistro: fechaLimpia,
              importe: Number(n.importe != null ? n.importe : 0),
              procesado: n.estado === 'Concepto FACTURADO' || n.procesado === true
            };
          });

          this.reporteNovedades = {
            alumnoId: data.legajo || this.legajo || 0,
            nombreCompleto: data.nombreCompleto || this.movimientos?.nombreCompleto || 'Alumno Registrado',
            novedades: novedadesProcesadas
          };
        } else {
          this.reporteNovedades = { alumnoId: this.legajo || 0, nombreCompleto: '', novedades: [] };
        }
        this.cargandoNovedades = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error crítico al golpear ConceptoController:", err);
        this.reporteNovedades = { alumnoId: this.legajo || 0, nombreCompleto: '', novedades: [] };
        this.cargandoNovedades = false;
        this.cdr.detectChanges();
      }
    });
  }
 toggleFormularioAlta() {
    this.mostrarFormularioAlta = !this.mostrarFormularioAlta;
    this.conceptoSeleccionadoId = null;
    this.importeNovedad = null;

    if (this.mostrarFormularioAlta) {
      this.service.getConceptosCombo().subscribe({
        next: (data: any) => {
          // 🌟 FORZAMOS EL CASTEO A (data as any) PARA QUE TYPESCRIPT NO CHILLE CON EL 'never'
          const listaExtraida = Array.isArray(data) ? data : ((data as any)?.content || []);
          
          this.conceptosDisponibles = listaExtraida.map((c: any) => ({
            id: c.conceptoId || c.id || 0,
            nombre: c.descripcion || c.nombre || ''
          }));

          console.log("Conceptos reales de la escuela Moreno mapeados:", this.conceptosDisponibles);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error al conectar con CombosController:", err);
          this.conceptosDisponibles = [];
          this.cdr.detectChanges();
        }
      });
    }
  }

  guardarNuevaNovedad() {
    if (!this.legajo || !this.periodoFiltro) return;
    if (!this.conceptoSeleccionadoId) {
      alert("Debe seleccionar un concepto o arancel devengable.");
      return;
    }
    if (this.importeNovedad === null || this.importeNovedad <= 0) {
      alert("Ingrese un importe válido mayor a $0.00.");
      return;
    }

    this.guardandoNovedad = true;
    this.cdr.detectChanges();

    const payload = {
      alumnoId: Number(this.legajo),
      periodoNombre: this.periodoFiltro.trim(), // Enviamos la descripción (ej: "MARZO - 2026")
      conceptoId: Number(this.conceptoSeleccionadoId),
      importe: Number(this.importeNovedad)
    };

    this.service.agregarNovedadManual(payload).subscribe({
      next: (grillaActualizada: any[]) => {
        // Al impactar el POST, tu Back devuelve el List<LineaDetalleDto> fresco del mes
        if (this.reporteNovedades) {
          this.reporteNovedades.novedades = grillaActualizada.map((n: any) => {
            const rawFecha = n.fechaRegistro || n.fecha_registro || null;
            let fechaLimpia = rawFecha;
            
            if (rawFecha && typeof rawFecha === 'string' && rawFecha.includes('T')) {
              const soloFecha = rawFecha.split('T')[0];
              const partes = soloFecha.split('-');
              if (partes.length === 3) {
                fechaLimpia = `${partes[2]}/${partes[1]}/${partes[0]}`;
              }
            }

            return {
              nombreConcepto: n.concepto || n.nombreConcepto || '',
              nombrePeriodo: n.periodo || n.nombrePeriodo || this.periodoFiltro,
              fechaRegistro: fechaLimpia,
              importe: Number(n.importe != null ? n.importe : 0),
              procesado: n.estado === 'Concepto FACTURADO' || n.procesado === true
            };
          });
        }

        // Limpiamos y cerramos panel
        this.conceptoSeleccionadoId = null;
        this.importeNovedad = null;
        this.mostrarFormularioAlta = false;
        this.guardandoNovedad = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al registrar la novedad manual en Spring Boot:", err);
        alert(err?.error?.message || "Ocurrió un error al procesar el alta contable en el servidor.");
        this.guardandoNovedad = false;
        this.cdr.detectChanges();
      }
    });
  }
}