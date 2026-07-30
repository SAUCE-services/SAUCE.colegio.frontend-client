import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeudaIndividual } from './deuda-individual';

describe('DeudaIndividual', () => {
  let component: DeudaIndividual;
  let fixture: ComponentFixture<DeudaIndividual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeudaIndividual],
    }).compileComponents();

    fixture = TestBed.createComponent(DeudaIndividual);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
