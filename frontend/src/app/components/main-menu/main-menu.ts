import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-menu',
  imports: [],
  templateUrl: './main-menu.html',
  styleUrl: './main-menu.scss',
})
export class MainMenu {

  isGuest: boolean = false;
  username: string = 'Giocatore';

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras.state) {
      this.isGuest = navigation.extras.state['isGuest'];
      
      if (navigation.extras.state['username']) {
        this.username = navigation.extras.state['username'];
      } else if (this.isGuest) {
        this.username = 'Ospite';
      }
    }
    
    console.log(`L’utente attuale è: ${this.username} (Ospite? ${this.isGuest})`);
  }

  handleLogout() {
    console.log('Disconnessione in corso... Ritorno al login.');
    this.router.navigate(['/login']);
  }

  startNewGame() {
    console.log(`Avvio partita per l'utente: ${this.username}`);
    this.router.navigate(['/game'], { state: { username: this.username } });
  }

  goToLeaderboard() {
    console.log(`Navigazione verso la classifica per l'utente: ${this.username}`);
    this.router.navigate(['/leaderboard'], { state: { isGuest: this.isGuest, username: this.username } });
  }

  goToHistory() {
    this.router.navigate(['/game-history'], { state: { isGuest: this.isGuest, username: this.username } });
  }
}