import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecaudacionFechas } from './recaudacion-fechas';

describe('RecaudacionFechas', () => {
  let component: RecaudacionFechas;
  let fixture: ComponentFixture<RecaudacionFechas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecaudacionFechas],
    }).compileComponents();

    fixture = TestBed.createComponent(RecaudacionFechas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
