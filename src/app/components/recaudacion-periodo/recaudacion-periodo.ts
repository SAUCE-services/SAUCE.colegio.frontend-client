import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaService } from '../../services/factura-service';
import { PeriodoService } from '../../services/periodo-service';
import { ReporteRecaudacionDto } from '../../models/colegio.models';

@Component({
  selector: 'app-recaudacion-periodo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recaudacion-periodo.html',
  styleUrl: './recaudacion-periodo.scss'
})
export class RecaudacionPeriodoComponent implements OnInit{
  private facturaService = inject(FacturaService);
  private periodoService = inject(PeriodoService);
  
  periodosDisponibles = signal<any[]>([]);
  periodoInput: string = ''; 
  reporte: ReporteRecaudacionDto | null = null;

  ngOnInit(): void {
  // 1. Cargar períodos desde el servicio
  this.periodoService.getPeriodosHistoricos().subscribe({
    next: (data: any) => {
      const lista = data?.content || data || [];
      this.periodosDisponibles.set(lista);
      // Opcional: preseleccionar el primero
      if (lista.length > 0) this.periodoInput = lista[0].descripcion;
    }
  });
}

consultar() {
  if (!this.periodoInput) return;
  this.facturaService.getRecaudacionPorPeriodo(this.periodoInput).subscribe(data => {
    this.reporte = data;
    // 🔍 MIRA ESTO EN LA CONSOLA DEL NAVEGADOR
    console.log("Datos recibidos:", data); 
  });
}

descargarPdf() {
  if (!this.periodoInput) {
    alert("Por favor, seleccione un período primero.");
    return;
  }

  this.facturaService.descargarPdfRecaudacionPeriodo(this.periodoInput).subscribe({
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
      console.error("Error al generar PDF de facturas:", err);
      alert("No se pudo cargar el archivo. Verifique la conexión.");
    }
  });
  }
}