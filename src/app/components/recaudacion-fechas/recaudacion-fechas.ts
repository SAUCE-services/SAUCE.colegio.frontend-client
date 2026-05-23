import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColegioServ } from '../../services/colegio-serv';
import { ReporteRecaudacionDto } from '../../models/colegio.models';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-recaudacion-fechas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recaudacion-fechas.html',
  styleUrl: './recaudacion-fechas.scss'
})
export class RecaudacionFechasComponent {
  private service = inject(ColegioServ);
  
  fechaDesde: string = '';
  fechaHasta: string = '';
  reporte: ReporteRecaudacionDto | null = null;

  consultar() {
    if (!this.fechaDesde || !this.fechaHasta) return;
    this.service.getRecaudacionPorFechas(this.fechaDesde, this.fechaHasta).subscribe(data => {
      this.reporte = data;
    });
  }

  descargarPdf() {
    if (!this.fechaDesde || !this.fechaHasta) return;
    this.service.descargarPdfRecaudacionFechas(this.fechaDesde, this.fechaHasta).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recaudacion_${this.fechaDesde}_al_${this.fechaHasta}.pdf`;
      a.click();
    });
  }
}