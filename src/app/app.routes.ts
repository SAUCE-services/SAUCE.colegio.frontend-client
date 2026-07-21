import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { ListaAlumnosComponent } from './components/lista-alumnos/lista-alumnos';
import { ListaCursosComponent } from './components/lista-cursos/lista-cursos';
import { ListaPeriodosComponent } from './components/lista-periodos/lista-periodos';
import { ListaConceptosComponent } from './components/lista-conceptos/lista-conceptos';
import { FormAlumnoComponent } from './components/form-alumno/form-alumno';
import { AnotadorComponent } from './components/anotador/anotador';
import { CuentaCorrienteComponent } from './components/cuenta-corriente/cuenta-corriente';
import { RecaudacionDiariaComponent } from './components/recaudacion-diaria/recaudacion-diaria';
import { FacturacionPeriodoComponent } from './components/facturacion-periodo/facturacion-periodo';
import { RecaudacionPeriodoComponent } from './components/recaudacion-periodo/recaudacion-periodo';
import { RecaudacionFechasComponent } from './components/recaudacion-fechas/recaudacion-fechas';
import { NovedadesCursoComponent } from './components/novedades-curso/novedades-curso';
import { DeudaGeneralComponent } from './components/deuda-general/deuda-general';
import { CicloLectivoComponent } from './components/ciclo-lectivo/ciclo-lectivo';
import { CargaPagoComponent } from './components/carga-pago/carga-pago';
import { FacturaCursoComponent } from './components/factura-curso/factura-curso';
import { FacturaAlumnoComponent } from './components/factura-alumno/factura-alumno';
import { HistoriaFacturacionComponent } from './components/historia-facturacion/historia-facturacion';

export const routes: Routes = [
  // 1. Ruta por defecto: Carga la Home
  { path: '', component: HomeComponent },
  
  // 2. Ruta dinámica para ver alumnos de un curso
  { path: 'curso/:nombreCurso', component: ListaAlumnosComponent },
  { path: 'cursos', component: ListaCursosComponent },
  { path: 'periodos', component: ListaPeriodosComponent },
  { path: 'conceptos', component: ListaConceptosComponent },
  { path: 'inscripcion', component: FormAlumnoComponent }, 
  { path: 'anotador', component: AnotadorComponent }, 
  { path: 'recaudacion', component: RecaudacionDiariaComponent },  
  { path: 'cuenta-corriente', component: CuentaCorrienteComponent }, 
  { path: 'facturacion-periodo', component: FacturacionPeriodoComponent },
  { path: 'recaudacion-periodo', component: RecaudacionPeriodoComponent }, 
  { path: 'recaudacion-fechas', component: RecaudacionFechasComponent },
  { path: 'novedades-curso', component: NovedadesCursoComponent},
  { path: 'deuda-general', component: DeudaGeneralComponent},
  { path: 'ciclo-lectivo', component: CicloLectivoComponent},
  { path: 'carga-pago', component: CargaPagoComponent},
  { path: 'factura-curso', component: FacturaCursoComponent},
  { path: 'factura-alumno', component: FacturaAlumnoComponent},
  { path: 'historia-facturacion', component: HistoriaFacturacionComponent },
  
  // 3. Comodín: Si escriben cualquier cosa mal, vuelve a la Home
  { path: '**', redirectTo: '' }
];