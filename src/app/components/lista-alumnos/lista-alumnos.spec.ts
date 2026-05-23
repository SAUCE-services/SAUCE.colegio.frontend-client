import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http-testing';
import { provideRouter } from '@angular/router';
import { ListaAlumnosComponent } from './lista-alumnos'; // ✅ Nombre de clase corregido
import { ColegioServ } from '../../services/colegio-serv';

describe('ListaAlumnosComponent', () => {
  let component: ListaAlumnosComponent;
  let fixture: ComponentFixture<ListaAlumnosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Al ser standalone, se importa directamente
      imports: [ListaAlumnosComponent], 
      providers: [
        ColegioServ,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]) // Necesario porque el componente inyecta ActivatedRoute
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListaAlumnosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});