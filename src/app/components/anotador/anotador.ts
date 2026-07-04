import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColegioServ } from '../../services/colegio-serv';
import { Anotador } from '../../models/colegio.models';

@Component({
  selector: 'app-anotador',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './anotador.html',
  styleUrl: './anotador.scss'
})
export class AnotadorComponent implements OnInit {
  private service = inject(ColegioServ);
  
  @Input() alumnoId?: number; 
  
  anotaciones: Anotador[] = [];
  nuevaNota: string = '';
  legajoBusqueda: number | null = null;
  nombreAlumno: string = ''; // Ahora también es el modelo del input de búsqueda por nombre
  mostrarCartel: boolean = false; // 🌟 Controla la visibilidad de la notificación

  // 🔎 Autocompletado por Apellido y Nombre
  resultadosBusqueda: any[] = [];
  mostrarSugerencias = false;
  indiceSugerenciaActiva = -1;
  alumnoConfirmado = false; // true solo cuando legajo y nombre corresponden a un match real

  ngOnInit() {
    if (this.alumnoId) {
      this.legajoBusqueda = this.alumnoId;
      this.buscarYConsultar();
    } else {
      this.cargarTodas();
    }
  }

  cargarTodas() {
    this.service.getTodasLasAnotaciones().subscribe(res => this.anotaciones = res);
  }

  // Busca por legajo (blur/enter en el campo Legajo). Siempre refresca el nombre,
  // así el campo nunca queda desincronizado si se cambia el legajo a mano.
  buscarYConsultar() {
    if (!this.legajoBusqueda) return;

    this.service.getAlumnoPorId(this.legajoBusqueda).subscribe({
      next: (alumno) => {
        this.nombreAlumno = `${alumno.apellido}, ${alumno.nombre}`;
        this.alumnoConfirmado = true;
        this.resultadosBusqueda = [];
        this.mostrarSugerencias = false;
      },
      error: () => {
        this.nombreAlumno = 'Alumno no encontrado';
        this.alumnoConfirmado = false;
      }
    });
  }

  // Búsqueda en tiempo real por Apellido y Nombre (mismo input que muestra el nombre confirmado)
  buscarEnTiempoReal() {
    this.alumnoConfirmado = false; // al tipear se invalida la identificación previa
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

  // Al hacer clic (o Enter) en un resultado de la búsqueda por nombre
  seleccionarAlumno(alumno: any) {
    this.legajoBusqueda = alumno.alumnoId;
    this.nombreAlumno = alumno.nombreCompleto;
    this.resultadosBusqueda = [];
    this.mostrarSugerencias = false;
    this.indiceSugerenciaActiva = -1;
    this.alumnoConfirmado = true;
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

  // Limpia toda la identificación, tanto por legajo como por nombre
  limpiarIdentificacion() {
    this.legajoBusqueda = null;
    this.nombreAlumno = '';
    this.resultadosBusqueda = [];
    this.mostrarSugerencias = false;
    this.indiceSugerenciaActiva = -1;
    this.alumnoConfirmado = false;
  }

guardarNota() {
    if (this.legajoBusqueda == null || !this.nuevaNota.trim()) {
      return;
    }

    const nota: Anotador = {
      alumnoId: this.legajoBusqueda,
      anotacion: this.nuevaNota,
      transaccionId: 0 
    };

    this.service.agregarAnotacion(nota).subscribe({
      next: () => {
        this.nuevaNota = '';
        this.cargarTodas(); // Refrescamos la grilla
        this.mostrarCartel = true; // 🌟 Activamos el cartel (se cerrará solo al dar clic en Entendido)
      },
      error: (err) => {
        console.error("Error al guardar en el servidor:", err);
      }
    });
  }
}