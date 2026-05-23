import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColegioServ } from '../../services/colegio-serv';
import { ReporteFacturaPeriodoDto } from '../../models/colegio.models';

@Component({
  selector: 'app-facturacion-periodo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturacion-periodo.html',
  styleUrl: './facturacion-periodo.scss'
})
export class FacturacionPeriodoComponent {
  private service = inject(ColegioServ);
  
  periodoInput: string = ''; 
  reporte: ReporteFacturaPeriodoDto | null = null;

  consultar() {
    if (!this.periodoInput) return;
    this.service.getFacturasPorPeriodo(this.periodoInput).subscribe(data => {
      this.reporte = data;
    });
  }

  descargarPdf() {
    if (!this.periodoInput) return;
    this.service.descargarPdfFacturasPeriodo(this.periodoInput).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facturas_periodo_${this.periodoInput}.pdf`;
      a.click();
    });
  }
}