import { Component, inject, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaService } from '../../services/factura-service';

@Component({
  selector: 'app-deuda-general',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './deuda-general.html',
  styleUrl: './deuda-general.scss'
})
export class DeudaGeneralComponent implements OnInit {
  private service = inject(FacturaService);
  private cdr = inject(ChangeDetectorRef);

  // Signals para el manejo reactivo del reporte
  listaDeudores = signal<any[]>([]);
  cargando = signal<boolean>(false);
  descargandoPdf = signal<boolean>(false);
  
  // Variables comunes de filtro
  terminoBusqueda: string = '';
  totalGlobalMora = 0;

  ngOnInit(): void {
    this.cargarReporteDeuda();
  }

  cargarReporteDeuda() {
    this.cargando.set(true);
    this.cdr.detectChanges();

    this.service.getDeudaGeneral().subscribe({
      next: (data: any[]) => {
        this.listaDeudores.set(data || []);
        
        // Calculamos el total acumulado de mora de toda la escuela
        this.totalGlobalMora = (data || []).reduce(
          (acc, item) => acc + Number(item.totalDeudaAlumno || 0), 0
        );
        
        this.cargando.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al recuperar deuda general:", err);
        this.cargando.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  // Buscador en caliente por nombre, legajo o DNI del alumno
  get deudoresFiltrados() {
    if (!this.terminoBusqueda.trim()) return this.listaDeudores();
    const txt = this.terminoBusqueda.toLowerCase().trim();
    
    return this.listaDeudores().filter(d => 
      (d.nombreAlumno || '').toLowerCase().includes(txt) ||
      String(d.legajo || d.idAlumno).includes(txt) ||
      String(d.dni || '').includes(txt)
    );
  }

  imprimirPdfGeneral() {
    this.descargandoPdf.set(true);
    this.cdr.detectChanges();

    this.service.descargarPdfDeudaGeneral().subscribe({
      next: (blob: Blob) => {
        const fileURL = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        // 'inline' abre directamente la vista del navegador lista para mandar a imprimir
        window.open(fileURL, '_blank');
        this.descargandoPdf.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al generar PDF consolidado:", err);
        alert("No se pudo compilar el archivo PDF del reporte contable.");
        this.descargandoPdf.set(false);
        this.cdr.detectChanges();
      }
    });
  }
}