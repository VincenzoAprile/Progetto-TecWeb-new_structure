import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { Router } from '@angular/router';
import { LeaderboardService, LeaderboardRow } from '../../services/leaderboard';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.scss'
})
export class Leaderboard implements OnInit {
  leaderboardRows: LeaderboardRow[] = []; 
  username: string = 'Giocatore'; 
  isGuest: boolean = false;        

  constructor(
    private leaderboardService: LeaderboardService,
    private router: Router,
    private cdr: ChangeDetectorRef 
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras.state) {
      if (navigation.extras.state['username']) {
        this.username = navigation.extras.state['username'];
        // Salviamo nel sessionStorage così se premi F5 non lo perdi!
        sessionStorage.setItem('current_username', this.username);
      }
      if (navigation.extras.state['isGuest'] !== undefined) {
        this.isGuest = navigation.extras.state['isGuest'];
      }
    } else {
      // Recupero di emergenza se l'utente ha aggiornato la pagina con F5
      this.username = sessionStorage.getItem('current_username') || 'Giocatore';
    }
  }

  async ngOnInit(): Promise<void> {
    try {
      console.log('Componente Classifica avviato per l\'utente:', this.username);
      
      // Recuperiamo i dati calcolati dal servizio
      const data = await this.leaderboardService.getCalculatedLeaderboard();
      
      // Assegniamo i dati alle righe della classifica
      this.leaderboardRows = data;
      
      console.log('Righe caricate nella classifica dal componente:', this.leaderboardRows);
      
      // FORZATURA: Diciamo ad Angular di ridisegnare la pagina ora che i dati dal DB sono arrivati!
      this.cdr.detectChanges();
      
    } catch (error) {
      console.error('Errore durante l\'inizializzazione del componente classifica:', error);
    }
  }

  goToMenu() {
    this.router.navigate(['/main-menu'], { 
      state: { 
        isGuest: this.isGuest, 
        username: this.username 
      } 
    });
  }
}