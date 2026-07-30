import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturacionConcepto } from './facturacion-concepto';

describe('FacturacionConcepto', () => {
  let component: FacturacionConcepto;
  let fixture: ComponentFixture<FacturacionConcepto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturacionConcepto],
    }).compileComponents();

    fixture = TestBed.createComponent(FacturacionConcepto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
