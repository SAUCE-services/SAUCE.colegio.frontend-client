import { Component, inject, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FacturaService } from '../../services/factura-service';
import { PeriodoService } from '../../services/periodo-service';

@Component({
  selector: 'app-facturacion-concepto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './facturacion-concepto.html',
  styleUrl: './facturacion-concepto.scss'
})
export class FacturacionConceptoComponent implements OnInit {
  private facturaService = inject(FacturaService);
  private periodoService = inject(PeriodoService);
  private cdr = inject(ChangeDetectorRef);

  periodosDisponibles = signal<any[]>([]);
  periodoInput: string = '';

  cargando = false;
  reporte: any = null;

  // 🌟 Filtro por concepto: null = "TODOS"
  conceptoFiltro: string | null = null;

  get conceptosFiltrados(): any[] {
    if (!this.reporte?.conceptos) return [];
    if (!this.conceptoFiltro) return this.reporte.conceptos;
    return this.reporte.conceptos.filter((c: any) => c.nombreConcepto === this.conceptoFiltro);
  }

  seleccionarConcepto(nombre: string | null) {
    this.conceptoFiltro = nombre;
  }

  ngOnInit(): void {
    this.periodoService.getPeriodosHistoricos().subscribe({
      next: (data: any) => {
        const lista = data?.content || data || [];
        this.periodosDisponibles.set(lista);
        if (lista.length > 0) this.periodoInput = lista[0].descripcion;
        this.cdr.detectChanges();
      }
    });
  }

  consultar() {
    if (!this.periodoInput) return;
    this.cargando = true;
    this.reporte = null;
    this.conceptoFiltro = null;
    this.cdr.detectChanges();

    this.facturaService.getFacturacionPorConceptoYPeriodo(this.periodoInput).subscribe({
      next: (data) => {
        this.reporte = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al consultar facturación por concepto:", err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  descargarPdf() {
    if (!this.periodoInput) {
      alert("Por favor, seleccione un período primero.");
      return;
    }

    this.facturaService.descargarPdfFacturacionPorConceptoYPeriodo(this.periodoInput).subscribe({
      next: (blob: Blob) => {
        if (blob.size === 0) {
          alert("El archivo generado está vacío.");
          return;
        }
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      },
      error: (err) => {
        console.error("Error al generar PDF de facturación por concepto:", err);
        alert("No se pudo cargar el archivo. Verifique la conexión.");
      }
    });
  }
}