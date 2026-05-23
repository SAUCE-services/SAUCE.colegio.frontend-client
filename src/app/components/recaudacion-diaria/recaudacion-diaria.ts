import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColegioServ } from '../../services/colegio-serv';
import { ReporteRecaudacionDto } from '../../models/colegio.models';

@Component({
  selector: 'app-recaudacion-diaria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recaudacion-diaria.html',
  styleUrl: './recaudacion-diaria.scss'
})
export class RecaudacionDiariaComponent {
  private service = inject(ColegioServ);
  
  fechaInput: string = ''; // Formato del input date: yyyy-mm-dd
  reporte: ReporteRecaudacionDto | null = null;

  consultar() {
    if (!this.fechaInput) return;
    // Convertimos yyyy-mm-dd a dd-mm-yyyy para el back
    const [y, m, d] = this.fechaInput.split('-');
    const fechaFormateada = `${d}-${m}-${y}`;

    this.service.getRecaudacionDiaria(fechaFormateada).subscribe(data => {
      this.reporte = data;
    });
  }

  descargarPdf() {
    if (!this.fechaInput) return;
    const [y, m, d] = this.fechaInput.split('-');
    const fechaFormateada = `${d}-${m}-${y}`;

    this.service.descargarPdfRecaudacion(fechaFormateada).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recaudacion_${this.fechaInput}.pdf`;
      a.click();
    });
  }
}