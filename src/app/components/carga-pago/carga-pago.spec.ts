import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CargaPago } from './carga-pago';

describe('CargaPago', () => {
  let component: CargaPago;
  let fixture: ComponentFixture<CargaPago>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargaPago],
    }).compileComponents();

    fixture = TestBed.createComponent(CargaPago);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
