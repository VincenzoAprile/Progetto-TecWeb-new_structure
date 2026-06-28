import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // AGGIUNTO ChangeDetectorRef
import { Router } from '@angular/router';
import { LeaderboardService, GameMatch } from '../../services/leaderboard';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-history',
  standalone: true, // Assicurati che sia coerente con il tuo setup
  imports: [CommonModule],
  templateUrl: './game-history.html',
  styleUrl: './game-history.scss',
})
export class GameHistory implements OnInit {
  
  historyMatches: GameMatch[] = [];
  isGuest: boolean = false; 
  username: string = 'Giocatore'; 

  constructor(
    private leaderboardService: LeaderboardService,
    private router: Router,
    private cdr: ChangeDetectorRef // AGGIUNTO QUI
  ) {
    const currentNavigation = this.router.getCurrentNavigation();
    if (currentNavigation && currentNavigation.extras.state) {
      if (currentNavigation.extras.state['isGuest'] !== undefined) {
        this.isGuest = currentNavigation.extras.state['isGuest'];
      }
      if (currentNavigation.extras.state['username']) {
        this.username = currentNavigation.extras.state['username'];
        // Salviamo nel sessionStorage per evitare che sparisca al refresh (F5)
        sessionStorage.setItem('current_username', this.username);
      }
    } else {
      // Recupero di sicurezza se l'utente rinfresca la pagina della cronologia
      this.username = sessionStorage.getItem('current_username') || 'Giocatore';
    }
  }

  // AGGIORNATO: Ora forza anche il rilevamento dei cambiamenti dopo l'await
  async ngOnInit(): Promise<void> {
    try {
      console.log(`Caricamento cronologia per l'utente: ${this.username}`);
      
      // Attendiamo i dati dal database tramite il servizio
      this.historyMatches = await this.leaderboardService.getMatches();
      
      console.log('Partite recuperate dal DB:', this.historyMatches);
      
      // FORZATURA DI SICUREZZA: Dice ad Angular di aggiornare l'HTML con i nuovi dati
      this.cdr.detectChanges();
      
    } catch (error) {
      console.error('Errore durante il caricamento della cronologia dal DB:', error);
    }
  }

  goBack() {
    console.log(`Ritorno al menu principale, ripasso l'utente: ${this.username}`);
    this.router.navigate(['/main-menu'], { 
      state: { 
        isGuest: this.isGuest, 
        username: this.username 
      } 
    });
  }
}