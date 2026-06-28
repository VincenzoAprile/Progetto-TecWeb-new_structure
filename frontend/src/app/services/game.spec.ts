import { TestBed } from '@angular/core/testing';
import { describe, it, beforeEach, expect } from 'vitest';
import { GameService } from './game';

describe('Game', () => {
  let service: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
