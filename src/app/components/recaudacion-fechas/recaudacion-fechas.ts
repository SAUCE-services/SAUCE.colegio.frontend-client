import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaService } from '../../services/factura-service';
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
  private service = inject(FacturaService);
  
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
  if (!this.fechaDesde || !this.fechaHasta) {
    alert("Por favor, seleccione ambas fechas.");
    return;
  }

  this.service.descargarPdfRecaudacionFechas(this.fechaDesde, this.fechaHasta).subscribe({
    next: (blob: Blob) => {
      if (blob.size === 0) {
        alert("El archivo generado está vacío.");
        return;
      }
      
      // 1. Crear la URL del objeto Blob
      const url = window.URL.createObjectURL(blob);
      
      // 2. Abrir en una pestaña nueva para visualización directa
      // Al no asignar el atributo 'download', el navegador mostrará el visor
      window.open(url, '_blank');
      
      // 3. Liberar la URL después de un tiempo prudencial
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    },
    error: (err) => {
      console.error("Error al generar PDF de recaudación por fechas:", err);
      alert("No se pudo cargar el archivo. Verifique la conexión.");
    }
  });
}
}