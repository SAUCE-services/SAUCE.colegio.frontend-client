import { Component, inject, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColegioServ } from '../../services/colegio-serv';

@Component({
  selector: 'app-ciclo-lectivo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ciclo-lectivo.html',
  styleUrl: './ciclo-lectivo.scss'
})
export class CicloLectivoComponent implements OnInit {
  private service = inject(ColegioServ);
  private cdr = inject(ChangeDetectorRef);

  // Signals reactivas de estado
  ciclos = signal<any[]>([]);
  cargando = signal<boolean>(false);
  procesandoForm = signal<boolean>(false);

  // Variables de control del formulario
  idCicloSeleccionado: number | null = null;
  descripcionCiclo: string = '';
  fechaDesde: string = '';
  fechaHasta: string = '';
  esNuevoMode = false;

  // 🌟 NUEVAS VARIABLES PARA EL CARTEL DE CONFIRMACIÓN CUSTOM
  mostrarCartelMensaje = false;
  cartelTipo: 'pregunta' | 'exito' | 'error' = 'exito';
  cartelTitulo: string = '';
  cartelMensaje: string = '';

  ngOnInit(): void {
    this.obtenerCiclos();
  }

  obtenerCiclos() {
    this.cargando.set(true);
    this.cdr.detectChanges();

    this.service.listarCiclosLectivosCompletos().subscribe({
      next: (data: any[]) => {
        const ordenados = (data || []).sort((a, b) => {
          const numA = parseInt(a.nombre.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.nombre.replace(/\D/g, '')) || 0;
          return numB - numA;
        });
        
        this.ciclos.set(ordenados);
        
        if (ordenados.length > 0 && !this.idCicloSeleccionado) {
          this.seleccionarCiclo(ordenados[0]);
        }
        
        this.cargando.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al listar los ciclos lectivos:", err);
        this.cargando.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarCiclo(ciclo: any) {
    this.esNuevoMode = false;
    this.idCicloSeleccionado = ciclo.cicloId;
    this.descripcionCiclo = ciclo.nombre || '';
    
    this.fechaDesde = ciclo.desde ? ciclo.desde.split('T')[0] : '';
    this.fechaHasta = ciclo.hasta ? ciclo.hasta.split('T')[0] : '';
    
    this.cdr.detectChanges();
  }

  activarNuevoCiclo() {
    this.esNuevoMode = true;
    this.idCicloSeleccionado = null;
    
    let maxAnio = new Date().getFullYear();
    if (this.ciclos().length > 0) {
      const aniosNumericos = this.ciclos()
        .map(c => parseInt(c.nombre.replace(/\D/g, '')))
        .filter(n => !isNaN(n));
      if (aniosNumericos.length > 0) {
        maxAnio = Math.max(...aniosNumericos);
      }
    }
    
    const proximoAnio = maxAnio + 1;
    this.descripcionCiclo = String(proximoAnio);
    
    this.fechaDesde = `${proximoAnio}-01-01`;
    this.fechaHasta = `${proximoAnio}-12-31`;
    
    this.cdr.detectChanges();
  }
  // Métodos auxiliares corregidos para vincular con las propiedades del HTML
  abrirCartel(tipo: 'pregunta' | 'exito' | 'error', titulo: string, mensaje: string) {
    this.cartelTipo = tipo;
    this.cartelTitulo = titulo;
    this.cartelMensaje = mensaje;
    this.mostrarCartelMensaje = true;
    this.cdr.detectChanges();
  }

  // 🌟 Disparador del nuevo cartel de confirmación antes de guardar
  solicitarConfirmacionGuardar() {
    if (!this.fechaDesde || !this.fechaHasta) {
      this.abrirCartel('error', 'Campos Incompletos', 'Por favor, complete los rangos de fecha Desde y Hasta.');
      return;
    }

    if (new Date(this.fechaDesde) > new Date(this.fechaHasta)) {
      this.abrirCartel('error', 'Error en Rangos', "La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'.");
      return;
    }

    const anioLimpio = this.descripcionCiclo.replace('Ciclo', '').trim();
    const tituloCartel = this.esNuevoMode ? 'Confirmar Alta' : 'Confirmar Modificación';
    const msgCartel = this.esNuevoMode 
      ? `¿Está seguro de dar de alta el Ciclo ${anioLimpio} con los rangos seleccionados?`
      : `¿Desea guardar las nuevas fechas de vigencia para el Ciclo ${anioLimpio}?`;

    this.abrirCartel('pregunta', tituloCartel, msgCartel);
  }

  // Ejecuta la acción real una vez confirmado el cartel custom
  confirmarAccionFormulario() {
    this.mostrarCartelMensaje = false; 
    this.procesandoForm.set(true); // 🌟 Se pasa a true al iniciar el viaje al servidor
    this.cdr.detectChanges();

    const anioLimpio = this.descripcionCiclo.replace('Ciclo', '').trim();
    const nombreFormateadoConCiclo = `Ciclo ${anioLimpio}`;

    const payload: any = {
      nombre: nombreFormateadoConCiclo,
      desde: this.fechaDesde,
      hasta: this.fechaHasta
    };

    if (!this.esNuevoMode && this.idCicloSeleccionado) {
      payload.cicloId = Number(this.idCicloSeleccionado);
    }

    // Invocamos el endpoint POST oficial de Spring Boot
    this.service.guardarOCorregirCicloLectivo(payload).subscribe({
      next: () => {
        const msgExito = this.esNuevoMode 
          ? `¡${nombreFormateadoConCiclo} dado de alta con éxito!` 
          : `¡${nombreFormateadoConCiclo} actualizado de forma correcta!`;
        

        // 🌟 CORREGIDO: Bajamos las banderas y reseteamos el estado del formulario de inmediato
        this.esNuevoMode = false;
        this.idCicloSeleccionado = null; 
        this.procesandoForm.set(false); // 👈 ¡CLAVE! El botón vuelve a decir "GUARDAR CAMBIOS"
        
        this.obtenerCiclos(); // Recarga la grilla contable en caliente
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al impactar ciclo lectivo:", err);
        alert("Ocurrió un error al procesar la solicitud en el servidor.");
        
        // 🌟 CORREGIDO: Si hay error, también liberamos el botón para que preceptoría pueda reintentar
        this.procesandoForm.set(false); 
        this.cdr.detectChanges();
      }
    });
  }

  // Auxiliares para el Modal de Alerta
  private abrirModalAlert(titulo: string, msj: string) {
    // Reutilizamos el booleano del modal poniéndole un layout limpio
    alert(msj);
  }
}