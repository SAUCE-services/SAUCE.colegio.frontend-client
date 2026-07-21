import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { ColegioServ } from '../../services/colegio-serv';
import { ConceptoService } from '../../services/concepto-service';
import { FacturaService } from '../../services/factura-service';
import { PeriodoService } from '../../services/periodo-service';
import { HistoriaFacturacionDto, FacturaDetalleDto, LineaDetalleDto, DeudaIndividualResponseDto, NovedadesAlumnoResponseDto, NovedadCargaDto, AlumnoDto } from '../../models/colegio.models'; 
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
  private conceptoService = inject(ConceptoService);
  private facturaService = inject(FacturaService);
  private periodoService = inject(PeriodoService);
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

  // VARIABLES MODAL NOVEDADES
  mostrarModalNovedades = false;
  cargandoNovedades = false;
  reporteNovedades: NovedadesAlumnoResponseDto | null = null;

  // VARIABLES MODAL DEUDAS
  mostrarModalDeudas = false;
  cargandoDeudaModal = false;
  reporteDeudaIndividual: DeudaIndividualResponseDto | null = null;

  // FILTRO REACTIVO PERÍODO
  periodoFiltro: string = '';  
  periodosDisponibles: string[] = [];

  // FORMULARIO CARGA MANUAL
  mostrarFormularioAlta = false;
  guardandoNovedad = false;
  conceptoSeleccionadoId: number | null = null;
  importeNovedad: number | null = null;
  conceptosDisponibles: any[] = [];

  // 🌟 NUEVAS VARIABLES PARA EL CARTEL DE CONFIRMACIÓN / ALERTA CUSTOM
  mostrarCartelMensaje = false;
  cartelTipo: 'pregunta' | 'alerta' = 'alerta';
  cartelTitulo: string = '';
  cartelMensaje: string = '';
  novedadPendienteAnular: any = null;

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

  onConceptoChange() {
    if (!this.conceptoSeleccionadoId) {
      this.importeNovedad = null;
      return;
    }
    const conceptoSeleccionado = this.conceptosDisponibles.find(c => c.id === Number(this.conceptoSeleccionadoId));
    if (conceptoSeleccionado && conceptoSeleccionado.importeBase !== null && conceptoSeleccionado.importeBase > 0) {
      this.importeNovedad = conceptoSeleccionado.importeBase;
    } else {
      this.importeNovedad = null;
    }
    this.cdr.detectChanges();
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

  get novedadesFiltradas() {
    if (!this.reporteNovedades || !this.reporteNovedades.novedades) return [];
    if (!this.periodoFiltro) return this.reporteNovedades.novedades;
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

    this.conceptoService.getConceptosCombo().subscribe({
      next: (data: any) => {
        const listaExtraida = Array.isArray(data) ? data : (data?.content || []);
        this.conceptosDisponibles = listaExtraida.map((c: any) => ({
          id: c.conceptoId || c.id || 0,
          nombre: c.descripcion || c.nombre || '',
          importeBase: c.importe !== undefined ? Number(c.importe) : null
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error preventivo al cargar conceptos:", err)
    });

    this.periodoService.getPeriodosHistoricos().subscribe({
      next: (res: any) => {
        const listaPeriodos = res?.content || [];
        if (listaPeriodos.length > 0) {
          this.periodosDisponibles = listaPeriodos.map((p: any) => p.descripcion);
          this.periodoFiltro = this.periodosDisponibles[0];
          this.cargarNovedadesDelServidor();
        } else {
          this.periodosDisponibles = ['MAYO - 2026'];
          this.periodoFiltro = 'MAYO - 2026';
          this.cargarNovedadesDelServidor();
        }
      },
      error: (err) => {
        console.error("Error al recuperar el listado de periodos:", err);
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

    this.conceptoService.getNovedadesPorAlumno(this.legajo, this.periodoFiltro).subscribe({
      next: (data: any) => {
        if (data) {
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
    this.cdr.detectChanges();

    if (this.mostrarFormularioAlta && this.conceptosDisponibles.length === 0) {
      this.conceptoService.getConceptosCombo().subscribe({
        next: (data: any) => {
          const listaExtraida = Array.isArray(data) ? data : ((data as any)?.content || []);
          this.conceptosDisponibles = listaExtraida.map((c: any) => ({
            id: c.conceptoId || c.id || 0,
            nombre: c.descripcion || c.nombre || ''
          }));
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
      periodoNombre: this.periodoFiltro.trim(),
      conceptoId: Number(this.conceptoSeleccionadoId),
      importe: Number(this.importeNovedad)
    };

    this.conceptoService.agregarNovedadManual(payload).subscribe({
      next: (grillaActualizada: any[]) => {
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
          }) as any;
        }
        this.conceptoSeleccionadoId = null;
        this.importeNovedad = null;
        this.mostrarFormularioAlta = false;
        this.guardandoNovedad = false;
        this.consultarCuenta(); // Refresca CC de fondo
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al registrar la novedad manual:", err);
        alert(err?.error?.message || "Ocurrió un error al procesar el alta contable.");
        this.guardandoNovedad = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 🌟 CAMBIADO: Abre el nuevo cartel de confirmación customizado
  eliminarNovedad(novedad: any) {
    this.novedadPendienteAnular = novedad;
    const nombreConceptoVisual = novedad.nombreConcepto || novedad.concepto;
    
    this.cartelTitulo = 'Confirmar Anulación';
    this.cartelMensaje = `¿Está completamente seguro de que desea eliminar la novedad "${nombreConceptoVisual}" por un valor de $${novedad.importe}?`;
    this.cartelTipo = 'pregunta';
    this.mostrarCartelMensaje = true;
    this.cdr.detectChanges();
  }

  // Ejecuta la baja real una vez aceptado el cartel custom
  ejecutarAnulacionConfirmada() {
    this.mostrarCartelMensaje = false;
    if (!this.novedadPendienteAnular) return;

    const novedad = this.novedadPendienteAnular;
    const nombreConceptoVisual = novedad.nombreConcepto || novedad.concepto;
    const legajoAlumno = this.legajo;
    const periodoNombre = novedad.nombrePeriodo || novedad.periodo || this.periodoFiltro;
    const conceptoObj = this.conceptosDisponibles.find(c => 
      c.nombre?.trim().toUpperCase() === nombreConceptoVisual?.trim().toUpperCase()
    );
    const idConcepto = conceptoObj ? (conceptoObj.id || conceptoObj.conceptoId) : null;
    const valorImporte = novedad.importe;

    if (!legajoAlumno || !periodoNombre || !idConcepto) {
      alert("Error: Faltan parámetros de negocio para ejecutar la baja.");
      return;
    }

    this.conceptoService.eliminarNovedadIndividual(
      Number(legajoAlumno), 
      Number(idConcepto), 
      periodoNombre, 
      Number(valorImporte)
    ).subscribe({
      next: () => {
        this.novedadPendienteAnular = null;
        this.cargarNovedadesDelServidor();
        this.consultarCuenta();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error devuelto por el Backend:", err);
        alert(err?.error?.message || "El servidor rechazó la anulación.");
      }
    });
  }
}