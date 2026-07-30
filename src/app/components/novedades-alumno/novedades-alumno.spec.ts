import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovedadesAlumno } from './novedades-alumno';

describe('NovedadesAlumno', () => {
  let component: NovedadesAlumno;
  let fixture: ComponentFixture<NovedadesAlumno>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovedadesAlumno],
    }).compileComponents();

    fixture = TestBed.createComponent(NovedadesAlumno);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
