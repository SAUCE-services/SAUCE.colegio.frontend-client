import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { AlumnoCompletoDto } from '../../models/colegio.models';
import { ColegioServ } from '../../services/colegio-serv';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-form-alumno',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './form-alumno.html',
  styleUrl: './form-alumno.scss'
})

export class FormAlumnoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ColegioServ);
  private cdr = inject(ChangeDetectorRef);

  // ✅ Observables para llenar todos los selectores del backend
  tiposDoc$ = this.service.getTiposDocumento();
  nacionalidades$ = this.service.getNacionalidades();
  transportes$ = this.service.getTransportes();
  nivelesEstudio$ = this.service.getNivelesEstudio();
  localidades$ = this.service.getLocalidades();
  obrasSociales$ = this.service.getObrasSociales();
  gruposSanguineos$ = this.service.getGruposSanguineos();
  parentescos$ = this.service.getParentescos();
  actividades$ = this.service.getActividades();
  departamentos$ = this.service.getDepartamentos();

  mostrarCartelMensaje = false;
  cartelTitulo = '';
  cartelMensaje = '';
  cartelTipo: 'exito' | 'error' = 'exito';

  // ✅ Formulario con la estructura exacta del DTO
  form = this.fb.group({
    // Datos Alumno
    alumnoId: [null as number | null], // Agregar este campo
    apellido: ['', Validators.required],
    nombre: ['', Validators.required],
    nroDocumento: ['', Validators.required],
    tipoDocumentoId: [null, Validators.required],
    curso: [''],
    nacionalidadId: [null],
    transporteId: [null],
fechaNacimiento: ['' as string | null], // ✅ Tipado para aceptar string
  fechaIngreso: ['' as string | null],    // ✅ Tipado para aceptar string

    // Datos Padre
    apellidoPadre: [''],
    nombrePadre: [''],
    nroDocumentoPadre: [null],
    tipoDocumentoPadreId: [null],
    pisoPadre: [''],
    callePadre: [''],
    nroPadre: [''],
   deptoPadre: [''], // ✅ Debe llamarse así para el HTML
  departamentoPadreId: [null], // ✅ Para el DTO del backend
    telCelPadre: [''],
    telFijoPadre: [''],
    nivelEstudioPadreId: [null],
    localidadPadreId: [null],
    presentePadre: [true],
    actividadPadreId: [null],
  parentescoPadreId: [null],

    // Datos Madre
    apellidoMadre: [''],
    nombreMadre: [''],
    nroDocumentoMadre: [null],
    tipoDocumentoMadreId: [null],
    calleMadre: [''],
    nroMadre: [''],
    deptoMadre: [''], // ✅ Debe llamarse así para el HTML
  departamentoMadreId: [null], // ✅ Para el DTO del backend
    pisoMadre: [''],
    telCelMadre: [''],
    telFijoMadre: [''],
    nivelEstudioMadreId: [null],
    localidadMadreId: [null],
    presenteMadre: [true],
    actividadMadreId: [null],
  parentescoMadreId: [null],

    // Salud
    enfermedades: [''],
    padeceEnfermedad: [false],
    tomaMedicamentos: [''],
    medicamentosAlergia: [''],
    grupoSanguineoId: [null],
    obraSocialId: [null],
    telEmergencia1: [''],
    telEmergencia2: [''],
  });

ngOnInit(): void {
    // 1. Obtenemos la fecha actual en formato local
    const hoy = new Date();
    
    // 2. La formateamos como YYYY-MM-DD para que el input type="date" la reconozca
    const fechaFormateada = hoy.toISOString().split('T')[0];

    // 3. Aplicamos los valores iniciales al formulario
    this.form.patchValue({
      fechaNacimiento: fechaFormateada,
      fechaIngreso: fechaFormateada
    });
  }

enviar() {
    if (this.form.valid) {
      const rawValues = this.form.getRawValue();
      const cleanData = JSON.parse(JSON.stringify(rawValues, (key, value) => {
        if (value === undefined || value === "undefined") return null;
        return value;
      }));

      const dataParaEnviar: AlumnoCompletoDto = {
        ...cleanData,
        curso: cleanData.curso || "",
        uuid: cleanData.uuid || ""
      };

      this.service.guardarAlumnoCompleto(dataParaEnviar).subscribe({
        next: (res) => {
          // 🌟 REEMPLAZO DE ALERT POR CARTEL ÉXITO
          this.cartelTipo = 'exito';
          this.cartelTitulo = 'Guardado Exitoso';
          this.cartelMensaje = '¡Guardado con éxito!';
          this.mostrarCartelMensaje = true;
          
          this.form.reset({ 
            presentePadre: true, 
            presenteMadre: true, 
            padeceEnfermedad: false 
          });
          this.ngOnInit(); 
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error detallado:', err);
          // 🌟 REEMPLAZO DE ALERT POR CARTEL ERROR
          this.cartelTipo = 'error';
          this.cartelTitulo = 'Error de Servidor';
          this.cartelMensaje = 'Error 400: El servidor rechazó los datos. Verifica que todos los campos de selección tengan una opción válida.';
          this.mostrarCartelMensaje = true;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.form.markAllAsTouched();
      // 🌟 REEMPLAZO DE ALERT POR CARTEL VALIDACIÓN
      this.cartelTipo = 'error';
      this.cartelTitulo = 'Campos Faltantes';
      this.cartelMensaje = 'Por favor, completa los campos obligatorios.';
      this.mostrarCartelMensaje = true;
      this.cdr.detectChanges();
    }
  }

  buscarAlumno(id: number) {
    if (!id) return;
    this.service.getAlumnoPorId(id).subscribe({
      next: (data) => {
        this.form.patchValue(data as any); 
      },
      // 🌟 REEMPLAZO DE ALERT POR CARTEL ERROR
      error: (err) => {
        this.cartelTipo = 'error';
        this.cartelTitulo = 'Error';
        this.cartelMensaje = 'No se encontró el legajo.';
        this.mostrarCartelMensaje = true;
        this.cdr.detectChanges();
      }
    });
  }
}


