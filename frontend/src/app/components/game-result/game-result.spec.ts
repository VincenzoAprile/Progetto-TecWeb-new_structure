import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameResult } from './game-result';

describe('GameResult', () => {
  let component: GameResult;
  let fixture: ComponentFixture<GameResult>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameResult],
    }).compileComponents();

    fixture = TestBed.createComponent(GameResult);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
