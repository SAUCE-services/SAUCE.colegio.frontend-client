import { Component, inject, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ColegioServ } from '../../services/colegio-serv';
import { PeriodoService } from '../../services/periodo-service';
import { PeriodoDto } from '../../models/colegio.models';

@Component({
  selector: 'app-lista-periodos',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './lista-periodos.html',
  styleUrl: './lista-periodos.scss'
})
export class ListaPeriodosComponent implements OnInit {
  private colegioService = inject(ColegioServ);
  private periodoService = inject(PeriodoService);
  private cdr = inject(ChangeDetectorRef);

  periodos: PeriodoDto[] = [];
  totalPaginas: number = 0;
  paginaActual: number = 0;

  // Filtros vinculados al HTML mediante [(ngModel)]
  filtroVenc1?: string;
  filtroVenc2?: string;
  filtroCiclo?: string;

  // VARIABLES PARA EL ALTA / MODIFICACIÓN
  mostrarFormulario = false;
  guardandoPeriodo = false;
  ciclosDisponibles = signal<any[]>([]);

  // Campos de negocio de la Ficha de Control
  idPeriodoSeleccionado: number | null = null;
  nuevoDescripcion: string = '';
  nuevoMes: string = '';
  nuevoFechaSegundo: string = '';
  nuevoCicloId: number | null = null;

  esNuevoMode = false;

  // VARIABLES CARTEL DE DIÁLOGO CUSTOM
  mostrarCartelMensaje = false;
  cartelTitulo: string = '';
  cartelMensaje: string = '';

  ngOnInit() {
    this.cargarPeriodos(0);
    this.cargarCiclosCombo();
  }

cargarPeriodos(page: number) {
    const formatearParaBack = (fecha?: string) => {
      if (!fecha) return undefined;
      const [anio, mes, dia] = fecha.split('-');
      return `${dia}-${mes}-${anio}`;
    };

    const venc1 = formatearParaBack(this.filtroVenc1);
    const venc2 = formatearParaBack(this.filtroVenc2);

    const observable = (venc1 || venc2 || this.filtroCiclo) 
      ? this.periodoService.buscarPeriodos(venc1, venc2, this.filtroCiclo, page)
      : this.periodoService.listarPeriodos(page);

    observable.subscribe({
      next: (response) => {
        this.periodos = response.content;
        this.totalPaginas = response.totalPages;
        this.paginaActual = response.number;

        // 🌟 CORREGIDO: Al limpiar o cargar, marcamos cuál es el período activo de la grilla,
        // pero NO le clavamos el "this.mostrarFormulario = true" para que no se abra la ventana sola.
        if (this.periodos.length > 0 && !this.idPeriodoSeleccionado && !this.esNuevoMode) {
          const primerPeriodo = this.periodos[0];
          this.idPeriodoSeleccionado = primerPeriodo.periodoId;
          this.nuevoDescripcion = String(primerPeriodo.descripcion || '');
          this.nuevoMes = primerPeriodo.mes ? String(primerPeriodo.mes).split('T')[0] : '';
          this.nuevoFechaSegundo = primerPeriodo.fechaSegundo ? String(primerPeriodo.fechaSegundo).split('T')[0] : '';
          const cicloMatch = this.ciclosDisponibles().find(c => c.nombre === primerPeriodo.nombreCiclo);
          this.nuevoCicloId = cicloMatch ? cicloMatch.cicloId : null;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar periodos:', err)
    });
  }

  cargarCiclosCombo() {
    this.colegioService.listarCiclosLectivosCompletos().subscribe({
      next: (res) => {
        this.ciclosDisponibles.set(res || []);
        this.cdr.detectChanges();
      }
    });
  }

  // 🌟 RESTAURADO: Método para abrir/cerrar el modal del formulario y limpiar estados
  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.resetearCamposForm();
    }
    this.cdr.detectChanges();
  }

  // 🌟 NUEVO MÉTODO: Carga los datos del período seleccionado en la ficha de la derecha
  // 🌟 CORREGIDO: Este método ahora se ejecuta exclusivamente cuando el usuario hace CLIC REAL en la tabla
  seleccionarPeriodo(p: PeriodoDto) {
    this.esNuevoMode = false;
    this.idPeriodoSeleccionado = p.periodoId;
    this.nuevoDescripcion = String(p.descripcion || '');
    
    this.nuevoMes = p.mes ? String(p.mes).split('T')[0] : '';
    this.nuevoFechaSegundo = p.fechaSegundo ? String(p.fechaSegundo).split('T')[0] : '';

    const cicloMatch = this.ciclosDisponibles().find(c => c.nombre === p.nombreCiclo);
    this.nuevoCicloId = cicloMatch ? cicloMatch.cicloId : null;

    // 🌟 CLAVE: Solo acá forzamos la apertura del modal flotante porque hubo un clic intencional
    this.mostrarFormulario = true; 

    this.cdr.detectChanges();
  }
  
  activarNuevoPeriodo() {
    this.esNuevoMode = true;
    this.idPeriodoSeleccionado = null;
    this.resetearCamposForm();
    this.mostrarFormulario = true;
    this.cdr.detectChanges();
  }

  resetearCamposForm() {
    this.nuevoDescripcion = '';
    this.nuevoMes = '';
    this.nuevoFechaSegundo = '';
    this.nuevoCicloId = null;
  }

  solicitarConfirmacion() {
    if (!this.nuevoDescripcion.trim() || !this.nuevoMes || !this.nuevoFechaSegundo || !this.nuevoCicloId) {
      this.cartelTitulo = 'Campos Incompletos';
      this.cartelMensaje = 'Por favor, complete absolutamente todos los campos requeridos en la ficha.';
      this.mostrarCartelMensaje = true;
      return;
    }

    this.cartelTitulo = 'Confirmar Operación';
    this.cartelMensaje = this.esNuevoMode 
      ? `¿Está seguro de asentar el período "${this.nuevoDescripcion.toUpperCase()}" en los registros oficiales?`
      : `¿Desea guardar las modificaciones del período "${this.nuevoDescripcion.toUpperCase()}"?`;
    
    this.mostrarCartelMensaje = true;
    this.cdr.detectChanges();
  }

  confirmarGuardado() {
    this.mostrarCartelMensaje = false;
    this.guardandoPeriodo = true;
    this.cdr.detectChanges();

    // Estructuramos el payload respetando el mapeo del controlador unificado del backend
    const payload: any = {
      descripcion: this.nuevoDescripcion.trim(),
      mes: this.nuevoMes, 
      fechaSegundo: this.nuevoFechaSegundo,
      ciclo: {
        cicloId: Number(this.nuevoCicloId)
      }
    };

    // Si estamos editando, le inyectamos su ID correspondiente para ejecutar el UPDATE
    if (!this.esNuevoMode && this.idPeriodoSeleccionado) {
      payload.periodoId = Number(this.idPeriodoSeleccionado);
    } else {
      payload.periodoId = 0;
    }

    this.periodoService.guardarPeriodo(payload).subscribe({
      next: () => {
        this.esNuevoMode = false;
        this.idPeriodoSeleccionado = null;
        this.guardandoPeriodo = false;
        this.cargarPeriodos(this.paginaActual); // Refresca los folios de fondo
      },
      error: (err) => {
        console.error("Error al impactar período contable:", err);
        alert("No se pudo procesar la solicitud en el servidor. Revise las restricciones.");
        this.guardandoPeriodo = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFiltrar() { this.cargarPeriodos(0); }
  limpiarFiltros() {
    this.filtroVenc1 = undefined;
    this.filtroVenc2 = undefined;
    this.filtroCiclo = undefined;
    this.idPeriodoSeleccionado = null;
    this.cargarPeriodos(0);
  }
}