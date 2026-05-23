import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ 1. Importar FormsModule
import { ColegioServ } from '../../services/colegio-serv';
import { PeriodoDto, PageResponse } from '../../models/colegio.models';

@Component({
  selector: 'app-lista-periodos',
  standalone: true,
  // ✅ 2. Agregar FormsModule aquí para que reconozca [(ngModel)]
  imports: [CommonModule, FormsModule], 
  templateUrl: './lista-periodos.html',
  styleUrl: './lista-periodos.scss'
})
export class ListaPeriodosComponent implements OnInit {
  private colegioService = inject(ColegioServ);
  private cdr = inject(ChangeDetectorRef);

  periodos: PeriodoDto[] = [];
  totalPaginas: number = 0;
  paginaActual: number = 0;
  
  // Filtros vinculados al HTML mediante [(ngModel)]
  filtroVenc1?: string;
  filtroVenc2?: string;
  filtroCiclo?: string;

  ngOnInit() {
    this.cargarPeriodos(0);
  }

cargarPeriodos(page: number) {
    const formatearParaBack = (fecha?: string) => {
      if (!fecha) return undefined;
      const [anio, mes, dia] = fecha.split('-');
      return `${dia}-${mes}-${anio}`;
    };

    const venc1 = formatearParaBack(this.filtroVenc1);
    const venc2 = formatearParaBack(this.filtroVenc2);

    // ✅ Ahora evaluamos si hay fecha O ciclo para llamar a la búsqueda
    const observable = (venc1 || venc2 || this.filtroCiclo) 
      ? this.colegioService.buscarPeriodos(venc1, venc2, this.filtroCiclo, page)
      : this.colegioService.listarPeriodos(page);

    observable.subscribe({
      next: (response) => {
        this.periodos = response.content;
        this.totalPaginas = response.totalPages;
        this.paginaActual = response.number;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar periodos:', err)
    });
  }

  onFiltrar() {
    this.cargarPeriodos(0);
  }
  // ✅ Actualizamos el botón limpiar
  limpiarFiltros() {
    this.filtroVenc1 = undefined;
    this.filtroVenc2 = undefined;
    this.filtroCiclo = undefined;
    this.cargarPeriodos(0);
  }
}