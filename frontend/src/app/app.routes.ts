import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { MainMenu } from './components/main-menu/main-menu';
import { Leaderboard } from './components/leaderboard/leaderboard';
import { GameHistory } from './components/game-history/game-history';
import { Game } from './components/game/game';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'main-menu', component: MainMenu},
  { path: 'leaderboard', component: Leaderboard},
  { path: 'game-history', component: GameHistory},
  { path: 'game', component: Game}
];