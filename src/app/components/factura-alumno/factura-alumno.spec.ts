import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturaAlumno } from './factura-alumno';

describe('FacturaAlumno', () => {
  let component: FacturaAlumno;
  let fixture: ComponentFixture<FacturaAlumno>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturaAlumno],
    }).compileComponents();

    fixture = TestBed.createComponent(FacturaAlumno);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
