import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecaudacionDiaria } from './recaudacion-diaria';

describe('RecaudacionDiaria', () => {
  let component: RecaudacionDiaria;
  let fixture: ComponentFixture<RecaudacionDiaria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecaudacionDiaria],
    }).compileComponents();

    fixture = TestBed.createComponent(RecaudacionDiaria);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
