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
  nombreAlumno: string = '';

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

  // Ahora solo busca el nombre del alumno sin filtrar la lista de abajo
  buscarYConsultar() {
    if (this.legajoBusqueda) {
      this.service.getAlumnoPorId(this.legajoBusqueda).subscribe({
        next: (alumno) => {
          this.nombreAlumno = `${alumno.apellido}, ${alumno.nombre}`;
          // Eliminamos la carga de anotaciones por alumno aquí
        },
        error: () => {
          this.nombreAlumno = 'Alumno no encontrado';
        }
      });
    }
  }

  guardarNota() {
    if (!this.nuevaNota.trim() || !this.legajoBusqueda) {
      alert("Debe ingresar un legajo y una anotación.");
      return;
    }

    const nota: Anotador = {
      alumnoId: this.legajoBusqueda,
      anotacion: this.nuevaNota,
      transaccionId: 0 
    };

    this.service.agregarAnotacion(nota).subscribe({
      next: () => {
        alert("Anotación registrada con éxito.");
        this.nuevaNota = '';
        this.cargarTodas(); // Al guardar, refrescamos la lista general
      },
      error: () => alert("Error al guardar la anotación.")
    });
  }
}