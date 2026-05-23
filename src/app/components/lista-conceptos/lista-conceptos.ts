import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ColegioServ } from '../../services/colegio-serv';
import { ConceptoDto } from '../../models/colegio.models';

@Component({
  selector: 'app-lista-conceptos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-conceptos.html',
  styleUrl: './lista-conceptos.scss'
})
export class ListaConceptosComponent implements OnInit {
  private colegioService = inject(ColegioServ);
  private cdr = inject(ChangeDetectorRef);
  
  mostrarFormulario = false;
  conceptos: ConceptoDto[] = [];
  totalPaginas: number = 0;
  paginaActual: number = 0;

  generandoPdf = false;
  guardandoEdicion = false;
  mostrarModalEditar = false;
  conceptoEnEdicion: ConceptoDto | null = null;

  // 🌟 NUEVA VARIABLE: Almacena el mensaje de confirmación estética
  mensajeExito: string | null = null;

  // Objeto para el nuevo concepto
  nuevoConcepto: Partial<ConceptoDto> = {
    conceptoId: undefined, 
    descripcion: '',
    importe: 0
  };

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
  }

  ngOnInit() {
    this.cargarConceptos(0);
  }

 cargarConceptos(page: number) {
    this.colegioService.listarConceptos(page).subscribe({
      next: (response) => {
        this.conceptos = response.content;
        this.totalPaginas = response.totalPages;
        this.paginaActual = response.number;
        this.cdr.detectChanges();
      }
    }); 
  }

  crearConcepto() {
    if (!this.nuevoConcepto.descripcion || this.nuevoConcepto.importe! <= 0) {
      alert("Por favor, complete descripción e importe válido.");
      return;
    }

    this.colegioService.guardarConcepto(this.nuevoConcepto).subscribe({
      next: () => {
        this.nuevoConcepto = { conceptoId: undefined, descripcion: '', importe: 0 };
        this.cargarConceptos(0); 
        this.mostrarFormulario = false; 
        alert("Concepto creado con éxito.");
      },
      error: (err) => console.error("Error al guardar:", err)
    });
  }

  abrirEditor(c: ConceptoDto) {
    this.conceptoEnEdicion = { ...c };
    this.mensajeExito = null; // Reseteamos mensajes previos
    this.mostrarModalEditar = true;
    this.cdr.detectChanges();
  }

  // 🌟 MÉTODO OPTIMIZADO: Muestra feedback visual lindo y auto-cierra el Pop-up
  guardarCambios() {
    if (!this.conceptoEnEdicion || !this.conceptoEnEdicion.conceptoId) return;
    this.guardandoEdicion = true;
    this.mensajeExito = null;
    this.cdr.detectChanges();

    const id = this.conceptoEnEdicion.conceptoId;
    this.colegioService.actualizarConcepto(id, this.conceptoEnEdicion).subscribe({
      next: () => {
        this.guardandoEdicion = false;
        // 1. Inyectamos el mensaje lindo de confirmación institucional
        this.mensajeExito = "✅ ¡Arancel modificado correctamente en el archivo oficial!";
        this.cdr.detectChanges();

        // 2. ⏳ TEMPORIZADOR: Espera 1.5 segundos para que el usuario lo lea y se cierra solo
        setTimeout(() => {
          this.mostrarModalEditar = false;
          this.conceptoEnEdicion = null;
          this.mensajeExito = null;
          this.cargarConceptos(this.paginaActual); // Refresca la grilla de fondo
          this.cdr.detectChanges();
        }, 1500);
      },
      error: (err) => {
        console.error("Error al editar el arancel:", err);
        alert("No se pudieron guardar las modificaciones en el servidor.");
        this.guardandoEdicion = false;
        this.cdr.detectChanges();
      }
    });
  }

  imprimirConceptos() {
    this.generandoPdf = true;
    this.cdr.detectChanges();

    this.colegioService.descargarPdfTodosLosConceptos().subscribe({
      next: (blob: Blob) => {
        const fileURL = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        window.open(fileURL, '_blank');
        this.generandoPdf = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al procesar el iText de conceptos:", err);
        this.generandoPdf = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 0 && nuevaPagina < this.totalPaginas) {
      this.cargarConceptos(nuevaPagina);
    }
  }
}