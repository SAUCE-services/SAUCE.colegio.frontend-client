import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColegioServ } from '../../services/colegio-serv';
import { MaestroService } from '../../services/maestro-service';
import { MaestroDto } from '../../models/colegio.models';

@Component({
  selector: 'app-maestros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maestros.html',
  styleUrl: './maestros.scss'
})
export class MaestrosComponent implements OnInit {
  private colegioService = inject(ColegioServ);
  private maestroService = inject(MaestroService);
  private cdr = inject(ChangeDetectorRef);

  mostrarFormulario = false;
  profesores: MaestroDto[] = [];
  totalPaginas = 0;
  paginaActual = 0;

  guardandoAlta = false;
  guardandoEdicion = false;
  mostrarModalEditar = false;
  profesorEnEdicion: Partial<MaestroDto> | null = null;
  mensajeExito: string | null = null;

  // Combos
  tiposDocumento: any[] = [];
  localidades: any[] = [];
  actividades: any[] = [];
  establecimientos: any[] = [];

  nuevoProfesor: Partial<MaestroDto> = this.profesorVacio();

  private profesorVacio(): Partial<MaestroDto> {
    return {
      apellido: '',
      nombre: '',
      nroDocumento: '',
      tipoDocumentoId: null,
      dirCalle: '',
      dirNumero: '',
      dirPiso: '',
      dirDepto: '',
      telefonoFijo: '',
      telefonoCelular: '',
      localidadId: null,
      actividadId: null,
      establecimientoId: null
    };
  }

  ngOnInit() {
    this.cargarProfesores(0);
    this.cargarCombos();
  }

  cargarCombos() {
    this.colegioService.getTiposDocumento().subscribe({ next: (data) => { this.tiposDocumento = data; this.cdr.detectChanges(); } });
    this.colegioService.getLocalidades().subscribe({ next: (data) => { this.localidades = data; this.cdr.detectChanges(); } });
    this.colegioService.getActividades().subscribe({ next: (data) => { this.actividades = data; this.cdr.detectChanges(); } });
    this.colegioService.getEstablecimientosCombo().subscribe({ next: (data) => { this.establecimientos = data; this.cdr.detectChanges(); } });
  }

  cargarProfesores(page: number) {
    this.maestroService.listarMaestros(page).subscribe({
      next: (response) => {
        this.profesores = response.content;
        this.totalPaginas = response.totalPages;
        this.paginaActual = response.number;
        this.cdr.detectChanges();
      }
    });
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (this.mostrarFormulario) {
      this.nuevoProfesor = this.profesorVacio();
    }
  }

  crearProfesor() {
    if (!this.nuevoProfesor.apellido || !this.nuevoProfesor.nombre) {
      alert("Por favor, complete al menos Apellido y Nombre.");
      return;
    }

    this.guardandoAlta = true;
    this.cdr.detectChanges();

    this.maestroService.guardarMaestro(this.nuevoProfesor).subscribe({
      next: () => {
        this.guardandoAlta = false;
        this.nuevoProfesor = this.profesorVacio();
        this.mostrarFormulario = false;
        this.cargarProfesores(0);
      },
      error: (err) => {
        console.error("Error al guardar el profesor:", err);
        alert("No se pudo guardar el profesor.");
        this.guardandoAlta = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirEditor(p: MaestroDto) {
    this.profesorEnEdicion = { ...p };
    this.mensajeExito = null;
    this.mostrarModalEditar = true;
    this.cdr.detectChanges();
  }

  guardarCambios() {
    if (!this.profesorEnEdicion || !this.profesorEnEdicion.maestroId) return;
    this.guardandoEdicion = true;
    this.mensajeExito = null;
    this.cdr.detectChanges();

    const id = this.profesorEnEdicion.maestroId;
    this.maestroService.actualizarMaestro(id, this.profesorEnEdicion).subscribe({
      next: () => {
        this.guardandoEdicion = false;
        this.mensajeExito = "✅ ¡Profesor modificado correctamente!";
        this.cdr.detectChanges();

        setTimeout(() => {
          this.mostrarModalEditar = false;
          this.profesorEnEdicion = null;
          this.mensajeExito = null;
          this.cargarProfesores(this.paginaActual);
          this.cdr.detectChanges();
        }, 1500);
      },
      error: (err) => {
        console.error("Error al editar el profesor:", err);
        alert("No se pudieron guardar las modificaciones en el servidor.");
        this.guardandoEdicion = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 0 && nuevaPagina < this.totalPaginas) {
      this.cargarProfesores(nuevaPagina);
    }
  }
}