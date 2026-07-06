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

  cursos: CursoDto[] = []; // Usado en la vista "Todos" (paginación mixta)
  cursosFiltrados: CursoDto[] = []; // Usado en la vista "Jardín" o "Colegio" (ya paginado por tipo en el backend)
  totalPaginas: number = 0;
  paginaActual: number = 0;  
  cargando = false;
  cicloSeleccionado?: string;
  ciclosDisponibles: string[] = [];

  // 🌟 Filtro de vista: Todos / Jardín / Colegio
  vistaSeleccionada: 'todos' | 'jardin' | 'colegio' = 'todos';

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

  // 🔧 Antes eran computed(), pero `cursos` es un array plano (no un signal),
  // así que Angular nunca detectaba el cambio y quedaban cacheados con el valor viejo.
  // Como métodos normales, se re-evalúan en cada ciclo de detección de cambios.
  cursosJardin(): CursoDto[] {
    return this.cursos.filter(c => this.esJardinOInicial(c.nombreEstablecimiento));
  }

  cursosColegio(): CursoDto[] {
    return this.cursos.filter(c => !this.esJardinOInicial(c.nombreEstablecimiento));
  }

  // En vista "Todos" se arma el grupo filtrando client-side sobre `cursos` (la página mixta).
  // En vista "Jardín"/"Colegio" el backend ya devolvió solo ese tipo, paginado correctamente,
  // así que usamos `cursosFiltrados` directo, sin volver a filtrar.
  itemsJardin(): CursoDto[] {
    return this.vistaSeleccionada === 'jardin' ? this.cursosFiltrados : this.cursosJardin();
  }

  itemsColegio(): CursoDto[] {
    return this.vistaSeleccionada === 'colegio' ? this.cursosFiltrados : this.cursosColegio();
  }

  // Compara ignorando tildes y mayúsculas, así "Jardín" y "Jardin" matchean igual
  private esJardinOInicial(nombreEstablecimiento?: string): boolean {
    const texto = (nombreEstablecimiento || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quita las tildes
      .toLowerCase();
    return texto.includes('jardin') || texto.includes('inicial');
  }

  ngOnInit() {
    this.cargarCursos(0);
    this.cargarFiltros();
    this.cargarCombosEstructura();
  }

  // Cambia la vista (Todos/Jardín/Colegio) y vuelve a la página 1 con la fuente de datos correcta
  cambiarVista(vista: 'todos' | 'jardin' | 'colegio') {
    if (this.vistaSeleccionada === vista) return;
    this.vistaSeleccionada = vista;
    this.cargarCursos(0);
  }

  cargarCursos(page: number) {
    this.cargando = true;

    // Vista Jardín o Colegio: pedimos al backend la página YA filtrada por tipo,
    // así la paginación es correcta (antes se filtraba en el cliente sobre una
    // página mixta de 10, y por eso la distribución entre páginas quedaba despareja).
    if (this.vistaSeleccionada === 'jardin' || this.vistaSeleccionada === 'colegio') {
      this.colegioService.listarCursosPorTipo(this.vistaSeleccionada, this.cicloSeleccionado, page).subscribe({
        next: (response) => this.actualizarGrillaFiltrada(response),
        error: (err) => {
          console.error('Error al cargar cursos por tipo:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
      return;
    }

    if (this.cicloSeleccionado) {
      this.colegioService.filtrarCursosPorCiclo(this.cicloSeleccionado, page).subscribe({
        next: (response) => this.actualizarGrilla(response),
        error: (err) => {
          console.error('Error en filtro paginado:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.colegioService.listarCursos(page).subscribe({
        next: (response) => this.actualizarGrilla(response),
        error: (err) => {
          console.error('Error al cargar folios:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  private actualizarGrilla(response: PageResponse<CursoDto>) {
    this.cursos = response.content;
    this.totalPaginas = response.totalPages;
    this.paginaActual = response.number;
    this.cargando = false;
    this.cdr.detectChanges();
  }

  private actualizarGrillaFiltrada(response: PageResponse<CursoDto>) {
    this.cursosFiltrados = response.content;
    this.totalPaginas = response.totalPages;
    this.paginaActual = response.number;
    this.cargando = false;
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