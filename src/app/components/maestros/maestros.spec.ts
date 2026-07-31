import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Maestros } from './maestros';

describe('Maestros', () => {
  let component: Maestros;
  let fixture: ComponentFixture<Maestros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Maestros],
    }).compileComponents();

    fixture = TestBed.createComponent(Maestros);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
