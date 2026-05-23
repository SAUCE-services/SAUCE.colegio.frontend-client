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

  // app/components/form-alumno/form-alumno.ts

// src/app/components/form-alumno/form-alumno.ts

enviar() {
  if (this.form.valid) {
    // Obtenemos todos los valores, incluso los deshabilitados
    const rawValues = this.form.getRawValue();

    // Función de limpieza para asegurar que los IDs sean null y no "undefined"
    const cleanData = JSON.parse(JSON.stringify(rawValues, (key, value) => {
      // Si el valor es undefined o una cadena que dice "undefined", devolver null
      if (value === undefined || value === "undefined") return null;
      return value;
    }));

    // Forzamos campos que el DTO de Java requiere y podrían estar vacíos
    const dataParaEnviar: AlumnoCompletoDto = {
      ...cleanData,
      curso: cleanData.curso || "",
      uuid: cleanData.uuid || ""
    };

    console.log('Enviando este JSON:', dataParaEnviar);

    this.service.guardarAlumnoCompleto(dataParaEnviar).subscribe({
      next: (res) => {
        alert("¡Guardado con éxito!");
        this.form.reset({ 
          presentePadre: true, 
          presenteMadre: true, 
          padeceEnfermedad: false 
        });
        // Volver a poner la fecha de hoy tras el reset
        this.ngOnInit(); 
      },
      error: (err) => {
        console.error('Error detallado:', err);
        alert('Error 400: El servidor rechazó los datos. Verifica que todos los campos de selección tengan una opción válida.');
      }
    });
  } else {
    this.form.markAllAsTouched();
    alert('Por favor, completa los campos obligatorios.');
  }
}

buscarAlumno(id: number) {
  if (!id) return;

  this.service.getAlumnoPorId(id).subscribe({
    next: (data) => {
      // Usamos 'as any' para que Angular ignore discrepancias menores de campos opcionales
      this.form.patchValue(data as any); 
      alert("Datos cargados. Legajo: " + data.alumnoId);
    },
    error: (err) => alert("No se encontró el legajo.")
  });
}
}


