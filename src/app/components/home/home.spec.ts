import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home'; // Corregido el nombre del import

describe('HomeComponent', () => { // Nombre descriptivo actualizado
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent], // Importa el componente standalone directamente
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Ejecuta la detección de cambios inicial
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the school title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    // Verifica que el título principal se renderice correctamente
    expect(compiled.querySelector('.titulo-colegio')?.textContent).toContain('COL. FRANCISCO P. MORENO');
  });
});