import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormAlumno } from './form-alumno';

describe('FormAlumno', () => {
  let component: FormAlumno;
  let fixture: ComponentFixture<FormAlumno>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormAlumno],
    }).compileComponents();

    fixture = TestBed.createComponent(FormAlumno);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
