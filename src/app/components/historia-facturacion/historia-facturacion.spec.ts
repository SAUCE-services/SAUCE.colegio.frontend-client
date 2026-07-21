import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriaFacturacion } from './historia-facturacion';

describe('HistoriaFacturacion', () => {
  let component: HistoriaFacturacion;
  let fixture: ComponentFixture<HistoriaFacturacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriaFacturacion],
    }).compileComponents();

    fixture = TestBed.createComponent(HistoriaFacturacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
