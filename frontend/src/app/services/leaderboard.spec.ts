import { TestBed } from '@angular/core/testing';
import { describe, it, beforeEach, expect } from 'vitest';
import { LeaderboardService } from './leaderboard';

describe('Leaderboard', () => {
  let service: LeaderboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeaderboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
