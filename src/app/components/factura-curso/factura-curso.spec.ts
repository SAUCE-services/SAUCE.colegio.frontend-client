import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturaCurso } from './factura-curso';

describe('FacturaCurso', () => {
  let component: FacturaCurso;
  let fixture: ComponentFixture<FacturaCurso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturaCurso],
    }).compileComponents();

    fixture = TestBed.createComponent(FacturaCurso);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
