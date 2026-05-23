import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecaudacionPeriodo } from './recaudacion-periodo';

describe('RecaudacionPeriodo', () => {
  let component: RecaudacionPeriodo;
  let fixture: ComponentFixture<RecaudacionPeriodo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecaudacionPeriodo],
    }).compileComponents();

    fixture = TestBed.createComponent(RecaudacionPeriodo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
