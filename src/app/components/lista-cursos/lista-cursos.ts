import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ColegioServ } from '../../services/colegio-serv';
import { CursoDto, PageResponse } from '../../models/colegio.models';

@Component({
  selector: 'app-lista-cursos',
  standalone: true,
  imports: [CommonModule, RouterLink],
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

  ngOnInit() {
    this.cargarCursos(0);
    this.cargarFiltros();
  }

  // ✅ Método inteligente que decide si pedir página filtrada o general
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

  // ✅ Centraliza la actualización de la vista
  private actualizarGrilla(response: PageResponse<CursoDto>) {
    this.cursos = response.content;
    this.totalPaginas = response.totalPages;
    this.paginaActual = response.number;
    this.cdr.detectChanges();
  }

// ✅ Simplificamos este método: solo actualiza el estado y llama a cargarCursos(0)
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
}