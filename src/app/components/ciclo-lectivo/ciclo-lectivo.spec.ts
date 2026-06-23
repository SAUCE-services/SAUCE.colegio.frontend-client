import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CicloLectivo } from './ciclo-lectivo';

describe('CicloLectivo', () => {
  let component: CicloLectivo;
  let fixture: ComponentFixture<CicloLectivo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CicloLectivo],
    }).compileComponents();

    fixture = TestBed.createComponent(CicloLectivo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
