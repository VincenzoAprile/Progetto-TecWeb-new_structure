import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game-result',
  imports: [],
  templateUrl: './game-result.html',
  styleUrl: './game-result.scss',
})
export class GameResult {

  @Input() resultstate: 'WIN' | 'LOSE' = 'WIN';
  @Input() title: string = '';
  @Input() attempts: number = 0;
  @Input() displaytime: string = '00:00';

  @Output() playagain = new EventEmitter<void>();
  @Output() mainmenu = new EventEmitter<void>();

  onPlayAgain() {
    this.playagain.emit();
  }

  onMainMenu() {
    this.mainmenu.emit();
  }
}
