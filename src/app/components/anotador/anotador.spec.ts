import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Anotador } from './anotador';

describe('Anotador', () => {
  let component: Anotador;
  let fixture: ComponentFixture<Anotador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Anotador],
    }).compileComponents();

    fixture = TestBed.createComponent(Anotador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
