import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeudaGeneral } from './deuda-general';

describe('DeudaGeneral', () => {
  let component: DeudaGeneral;
  let fixture: ComponentFixture<DeudaGeneral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeudaGeneral],
    }).compileComponents();

    fixture = TestBed.createComponent(DeudaGeneral);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
