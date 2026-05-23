import { TestBed } from '@angular/core/testing';

import { ColegioServ } from './colegio-serv';

describe('ColegioServ', () => {
  let service: ColegioServ;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ColegioServ);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
