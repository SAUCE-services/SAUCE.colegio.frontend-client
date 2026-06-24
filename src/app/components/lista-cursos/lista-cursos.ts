import { Component, inject, OnInit, ChangeDetectorRef, signal } from '@angular/core';  
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ColegioServ } from '../../services/colegio-serv';
import { CursoDto, PageResponse } from '../../models/colegio.models';

@Component({
  selector: 'app-lista-cursos',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './lista-cursos.html',
  styleUrl: './lista-cursos.scss'
})
export class ListaCursosComponent implements OnInit {
  private colegioService = inject(ColegioServ);
  private cdr = inject(ChangeDetectorRef);

  cursos: CursoDto[] = [];
  totalPaginas: number = 0;
  paginaActual: number = 0;  
  cicloSeleccionado?: string;
  ciclosDisponibles: string[] = [];  

  // 🌟 VARIABLE DE CONTROL PARA FORMULARIO FLOTANTE (ABM)
  mostrarFormulario = false;
  procesandoForm = false;

  // Signals para poblar las listas desplegables del Modal
  turnosCombo = signal<any[]>([]);
  maestrosCombo = signal<any[]>([]);
  establecimientosCombo = signal<any[]>([]);
  ciclosEntidadCombo = signal<any[]>([]);

  // Estructura del formulario (CursoCargaDto)
  idCursoSeleccionado: number | null = null;
  nuevoDescripcion: string = '';
  nuevoTurnoId: number | null = null;
  nuevoMaestroId: number | null = null;
  nuevoEstablecimientoId: number | null = null;
  nuevoCicloId: number | null = null;
  esNuevoMode = false;

  // SISTEMA DE CONFIRMACIÓN CUSTOMIZADO
  mostrarCartelMensaje = false;
  cartelTitulo: string = '';
  cartelMensaje: string = '';

  ngOnInit() {
    this.cargarCursos(0);
    this.cargarFiltros();
    this.cargarCombosEstructura();
  }

  cargarCursos(page: number) {
    if (this.cicloSeleccionado) {
      this.colegioService.filtrarCursosPorCiclo(this.cicloSeleccionado, page).subscribe({
        next: (response) => this.actualizarGrilla(response),
        error: (err) => console.error('Error en filtro paginado:', err)
      });
    } else {
      this.colegioService.listarCursos(page).subscribe({
        next: (response) => this.actualizarGrilla(response),
        error: (err) => console.error('Error al cargar folios:', err)
      });
    }
  }

  private actualizarGrilla(response: PageResponse<CursoDto>) {
    this.cursos = response.content;
    this.totalPaginas = response.totalPages;
    this.paginaActual = response.number;
    this.cdr.detectChanges();
  }

  onFiltrarPorCiclo(anio: string) {
    this.cicloSeleccionado = (anio === "") ? undefined : anio;
    this.cargarCursos(0);
  }  

  cargarFiltros() {
    this.colegioService.getCiclosDisponibles().subscribe({
      next: (data) => {
        this.ciclosDisponibles = data;
        this.cdr.detectChanges();
      }
    });
  }

  // Descarga masiva de la estructura de combos institucionales
  cargarCombosEstructura() {
    this.colegioService.getTurnosCombo().subscribe(res => this.turnosCombo.set(res || []));
    this.colegioService.getMaestrosCombo().subscribe(res => this.maestrosCombo.set(res || []));
    this.colegioService.getEstablecimientosCombo().subscribe(res => this.establecimientosCombo.set(res || []));
    this.colegioService.getCiclosComboEntidades().subscribe(res => this.ciclosEntidadCombo.set(res || []));
  }

  // 🌟 MODAL: Abre la ventana en modo alta vacía
  activarNuevoCurso() {
    this.esNuevoMode = true;
    this.idCursoSeleccionado = null;
    this.nuevoDescripcion = '';
    this.nuevoTurnoId = null;
    this.nuevoMaestroId = null;
    this.nuevoEstablecimientoId = this.establecimientosCombo()[0]?.establecimientoId || null; // Fallback jardín/colegio
    this.nuevoCicloId = this.ciclosEntidadCombo()[0]?.cicloId || null;
    this.mostrarFormulario = true;
    this.cdr.detectChanges();
  }

  // 🌟 MODAL: Mappea el objeto de la grilla para abrir en modo edición
  abrirEditorCurso(c: CursoDto, event: Event) {
    event.stopPropagation(); // Evita redirigir a los alumnos del curso al hacer clic para editar
    this.esNuevoMode = false;
    this.idCursoSeleccionado = c.cursoId;
    this.nuevoDescripcion = c.descripcion || '';

    // Mappeamos los IDs buscando equivalencias de texto desde los combos cargados en memoria
    const turnoMatch = this.turnosCombo().find(t => t.descripcion === c.nombreTurno);
    this.nuevoTurnoId = turnoMatch ? turnoMatch.turnoId : null;

    const maestroMatch = this.maestrosCombo().find(m => (m.nombre === c.nombreMaestro || `${m.apellido}, ${m.nombre}` === c.nombreMaestro));
    this.nuevoMaestroId = maestroMatch ? maestroMatch.id : null;

    const estMatch = this.establecimientosCombo().find(e => e.nombre === c.nombreEstablecimiento);
    this.nuevoEstablecimientoId = estMatch ? estMatch.establecimientoId : null;

    const cicloMatch = this.ciclosEntidadCombo().find(ci => c.nombreCiclo?.includes(ci.nombre));
    this.nuevoCicloId = cicloMatch ? cicloMatch.cicloId : null;

    this.mostrarFormulario = true;
    this.cdr.detectChanges();
  }

  solicitarConfirmacion() {
    if (!this.nuevoDescripcion.trim() || !this.nuevoTurnoId || !this.nuevoMaestroId || !this.nuevoCicloId || !this.nuevoEstablecimientoId) {
      this.cartelTitulo = 'Campos Incompletos';
      this.cartelMensaje = 'Por favor, asigne todos los campos requeridos (Descripción, Turno, Docente, Ciclo y Establecimiento).';
      this.mostrarCartelMensaje = true;
      return;
    }

    this.cartelTitulo = 'Confirmar Registro';
    this.cartelMensaje = this.esNuevoMode 
      ? `¿Desea dar de alta la división "${this.nuevoDescripcion.toUpperCase()}" en la base de datos oficial?`
      : `¿Confirmar cambios estructurales sobre la división "${this.nuevoDescripcion.toUpperCase()}"?`;
    this.mostrarCartelMensaje = true;
    this.cdr.detectChanges();
  }

  confirmarGuardado() {
    this.mostrarCartelMensaje = false;
    this.procesandoForm = true;
    this.cdr.detectChanges();

    // Construcción exacta del CursoCargaDto esperado por el Backend
    const payload = {
      cursoId: this.esNuevoMode ? 0 : Number(this.idCursoSeleccionado),
      descripcion: this.nuevoDescripcion.trim(),
      turnoId: Number(this.nuevoTurnoId),
      maestroId: Number(this.nuevoMaestroId),
      establecimientoId: Number(this.nuevoEstablecimientoId),
      cicloId: Number(this.nuevoCicloId)
    };

    this.colegioService.guardarOModificarCurso(payload).subscribe({
      next: () => {
        this.mostrarFormulario = false;
        this.procesandoForm = false;
        this.idCursoSeleccionado = null;
        this.cargarCursos(this.paginaActual); // Sincroniza la grilla de fondo
      },
      error: (err) => {
        console.error("Error al guardar curso:", err);
        alert("Ocurrió una falla en el servidor al asentar la división.");
        this.procesandoForm = false;
        this.cdr.detectChanges();
      }
    });
  }
}