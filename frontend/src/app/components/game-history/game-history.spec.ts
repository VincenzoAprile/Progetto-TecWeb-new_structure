import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameHistory } from './game-history';

describe('GameHistory', () => {
  let component: GameHistory;
  let fixture: ComponentFixture<GameHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(GameHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
