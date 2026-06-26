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
  if (!this.fechaInput) {
    alert("Por favor, seleccione una fecha primero.");
    return;
  }
  
  const [y, m, d] = this.fechaInput.split('-');
  const fechaFormateada = `${d}-${m}-${y}`;

  this.service.descargarPdfRecaudacion(fechaFormateada).subscribe({
    next: (blob: Blob) => {
      if (blob.size === 0) {
        console.error("El archivo PDF recibido está vacío.");
        alert("Error: El archivo generado está vacío.");
        return;
      }
      
      // 1. Crear la URL del objeto Blob
      const url = window.URL.createObjectURL(blob);
      
      // 2. Abrir directamente en una nueva pestaña para visualización
      // Al no incluir el atributo 'download', el navegador usará su visor de PDF predeterminado
      window.open(url, '_blank');
      
      // Opcional: Liberar la URL después de un tiempo para no ocupar memoria innecesaria
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    },
    error: (err) => {
      console.error("Error al descargar el PDF:", err);
      alert("No se pudo cargar el archivo. Verifique la conexión o el servidor.");
    }
  });
}
}