import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';
import { describe, it, beforeEach, expect } from 'vitest';

describe('Auth', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
