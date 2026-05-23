import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturacionPeriodo } from './facturacion-periodo';

describe('FacturacionPeriodo', () => {
  let component: FacturacionPeriodo;
  let fixture: ComponentFixture<FacturacionPeriodo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturacionPeriodo],
    }).compileComponents();

    fixture = TestBed.createComponent(FacturacionPeriodo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
