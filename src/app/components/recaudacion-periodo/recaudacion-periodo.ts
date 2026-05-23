import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColegioServ } from '../../services/colegio-serv';
import { ReporteRecaudacionDto } from '../../models/colegio.models';

@Component({
  selector: 'app-recaudacion-periodo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recaudacion-periodo.html',
  styleUrl: './recaudacion-periodo.scss'
})
export class RecaudacionPeriodoComponent {
  private service = inject(ColegioServ);
  
  periodoInput: string = ''; 
  reporte: ReporteRecaudacionDto | null = null;

  consultar() {
    if (!this.periodoInput) return;
    this.service.getRecaudacionPorPeriodo(this.periodoInput).subscribe(data => {
      this.reporte = data;
    });
  }

  descargarPdf() {
    if (!this.periodoInput) return;
    this.service.descargarPdfRecaudacionPeriodo(this.periodoInput).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recaudacion_periodo_${this.periodoInput}.pdf`;
      a.click();
    });
  }
}