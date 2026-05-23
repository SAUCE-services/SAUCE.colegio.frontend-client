import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaPeriodos } from './lista-periodos';

describe('ListaPeriodos', () => {
  let component: ListaPeriodos;
  let fixture: ComponentFixture<ListaPeriodos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaPeriodos],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaPeriodos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
