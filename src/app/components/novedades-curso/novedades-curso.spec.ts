import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovedadesCurso } from './novedades-curso';

describe('NovedadesCurso', () => {
  let component: NovedadesCurso;
  let fixture: ComponentFixture<NovedadesCurso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovedadesCurso],
    }).compileComponents();

    fixture = TestBed.createComponent(NovedadesCurso);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
