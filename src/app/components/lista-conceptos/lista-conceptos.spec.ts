import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaConceptos } from './lista-conceptos';

describe('ListaConceptos', () => {
  let component: ListaConceptos;
  let fixture: ComponentFixture<ListaConceptos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaConceptos],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaConceptos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
