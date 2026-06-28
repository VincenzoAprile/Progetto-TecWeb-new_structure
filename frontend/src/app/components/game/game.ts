import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Wikipedia } from '../../services/wikipedia';
import { LeaderboardService } from '../../services/leaderboard';
import { GameService } from '../../services/game';
import { GameResult } from '../game-result/game-result';
import { CommonModule } from '@angular/common'; // IMPORTANTE: Aggiunto per poter usare le direttive base nell'HTML se servono

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [GameResult, CommonModule], // Aggiunto CommonModule
  templateUrl: './game.html',
  styleUrl: './game.scss'
})
export class Game implements OnInit, OnDestroy {
  attempts: number = 0;
  secondsElapsed: number = 0;
  displayTime: string = '00:00';
  private timerId: any;

  gameState: string = 'SELECT';
  selectedCategoryName: string = ''; 

  originalTitle: string = '';
  originalText: string = '';
  obscuredText: string = '';
  guessedWords: string[] = [];
  username: string = 'Giocatore'; 

  // Proprietà di comodo per esporre i token formattati all'HTML
  processedTokensHTML: string[] = [];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private wikiService: Wikipedia,
    private leaderboardService: LeaderboardService,
    private gameService: GameService
  ) {
    const currentNavigation = this.router.getCurrentNavigation();
    if (currentNavigation?.extras?.state?.['username']) {
      this.username = currentNavigation.extras.state['username'];
    }
  }

  async ngOnInit() {
    const loggedInUsername = this.username; 

    if (loggedInUsername && loggedInUsername !== 'Anonimo' && loggedInUsername !== 'Ospite' && loggedInUsername !== 'Giocatore') {
      try {
        const savedGame = await this.gameService.getSavedGameState(loggedInUsername);
        
        if (savedGame) {
          if (confirm(`Bentornato ${loggedInUsername}! C'è una partita interrotta salvata sul server. Vuoi riprenderla?`)) {
            this.gameState = 'PLAYING';
            this.selectedCategoryName = savedGame.category;
            this.originalTitle = savedGame.title;
            this.originalText = savedGame.originalText;
            this.obscuredText = savedGame.obscuredText;
            this.attempts = savedGame.attempts;
            this.secondsElapsed = savedGame.secondsElapsed;
            this.guessedWords = savedGame.guessedWords;
            
            this.username = loggedInUsername; 

            this.startTimer(); 
            this.updateGameText(); // Rigenera i token grafici per l'HTML
            this.cdr.detectChanges();
            return;
          } else {
            await this.gameService.clearActiveGame(loggedInUsername);
          }
        }
      } catch (error) {
        console.error("Errore nel recupero della sessione dal server:", error);
      }
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  goToMenu() {
    this.router.navigate(['/main-menu'], { state: { isGuest: false, username: this.username } });
  }

  selectCategory(categoryName: string) {
    this.gameState = 'LOADING';
    this.selectedCategoryName = categoryName;
    this.attempts = 0;
    this.secondsElapsed = 0;
    this.displayTime = '00:00';
    this.guessedWords = [];
    this.cdr.detectChanges();

    const pools: { [key: string]: string[] } = {
      'Videogiochi': [
        'Super Mario Bros.', 'Grand Theft Auto V', 'The Legend of Zelda', 
        'Minecraft', 'Crash Bandicoot', 'Pac-Man', 'Fortnite', 'Pokémon Red and Blue'
      ],
      'Serie_animate': [
        'Dragon Ball', 'I Simpson', 'Naruto', 'Death Note', 
        'One Piece', 'Pokémon (serie animata)', 'Detective Conan', 'Futurama'
      ],
      'Informatica': [
        'JavaScript', 'Python (linguaggio di programmazione)', 'Linux', 
        'Java (linguaggio di programmazione)', 'Computer', 'Internet', 'Algoritmo', 'HTML'
      ]
    };

    const currentPool = pools[categoryName];
    
    if (!currentPool) {
      this.gameState = 'SELECT';
      this.cdr.detectChanges();
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * currentPool.length);
    const chosenTitle = currentPool[randomIndex];

    this.loadSpecificArticle(chosenTitle);
  }

  private loadSpecificArticle(title: string) {
    const url = `https://it.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(title)}&format=json&origin=*`;
    
    fetch(url)
      .then(response => response.json())
      .then(async data => {
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        this.originalTitle = pages[pageId].title;
        if (this.originalTitle.includes('(')) {
          this.originalTitle = this.originalTitle.split('(')[0].trim();
        }

        this.originalText = pages[pageId].extract.substring(0, 500);
        
        this.updateGameText();
        this.gameState = 'PLAYING';
        this.startTimer();

        if (this.username && this.username !== 'Anonimo' && this.username !== 'Ospite' && this.username !== 'Giocatore') {
          try {
            await this.gameService.saveCurrentGameState({
              username: this.username,
              category: this.selectedCategoryName,
              title: this.originalTitle,
              originalText: this.originalText,
              obscuredText: this.obscuredText,
              attempts: this.attempts,
              secondsElapsed: this.secondsElapsed,
              guessedWords: this.guessedWords
            });
            console.log('Partita iniziale memorizzata sul server.');
          } catch (err) {
            console.error('Errore nel salvataggio iniziale della partita:', err);
          }
        }

        this.cdr.detectChanges();
      })
      .catch(err => {
        console.error(err);
        this.gameState = 'SELECT';
        this.cdr.detectChanges();
      });
  }

  /**
   * Aggiorna sia il testo oscurato completo che l'array di token strutturati per la resa grafica
   */
  updateGameText() {
    const tokens = this.originalText.split(/(\s+|,|\.|\(|\)|;|:|-|'|’)/);
    const processedTokens = tokens.map(token => {
      if (/^(\s+|,|\.|\(|\)|;|:|-|'|’)+$/.test(token)) return token;
      if (/^\d+$/.test(token)) return token;

      const cleanWord = token.trim().toLowerCase();
      if (cleanWord.length <= 3) return token;
      if (this.guessedWords.includes(cleanWord)) return token;

      const firstLetter = token.charAt(0);
      const lastLetter = token.charAt(token.length - 1);
      const middleStars = '•'.repeat(token.length - 2);
      return `${firstLetter}${middleStars}${lastLetter}`;
    });
    
    this.processedTokensHTML = processedTokens; // Salviamo i token splittati per intercettarli uno ad uno nell'HTML
    this.obscuredText = processedTokens.join('');
  }

  /**
   * Helper per capire se un token visualizzato fa parte delle parole sbloccate con successo
   */
  isTokenGuessed(token: string): boolean {
    const cleanWord = token.trim().toLowerCase();
    // Escludiamo punteggiatura, spazi o parole corte che di base non erano bloccate
    if (!cleanWord || cleanWord.length <= 3 || /^(\s+|,|\.|\(|\)|;|:|-|'|’)+$/.test(cleanWord) || /^\d+$/.test(cleanWord)) {
      return false;
    }
    return this.guessedWords.includes(cleanWord);
  }

  submitWord() {
    const inputElement = document.getElementById('word-guess') as HTMLInputElement;
    if (!inputElement) return;

    const userGuess = inputElement.value.trim().toLowerCase();
    if (userGuess.length <= 2) {
      alert('Inserisci una parola di almeno 3 lettere!');
      return;
    }

    this.attempts++;

    if (!this.guessedWords.includes(userGuess)) {
      if (this.originalText.toLowerCase().includes(userGuess)) {
        this.guessedWords.push(userGuess);
        this.updateGameText();

        if (this.username && this.username !== 'Anonimo' && this.username !== 'Ospite' && this.username !== 'Giocatore') {
          this.gameService.saveCurrentGameState({
            username: this.username,
            category: this.selectedCategoryName,
            title: this.originalTitle,
            originalText: this.originalText,
            obscuredText: this.obscuredText,
            attempts: this.attempts,
            secondsElapsed: this.secondsElapsed,
            guessedWords: this.guessedWords
          });
        }
      }
    }

    inputElement.value = '';
    this.cdr.detectChanges();
  }

  submitTitle() {
    const inputElement = document.getElementById('title-guess') as HTMLInputElement;
    if (!inputElement) return;

    const userTitleGuess = inputElement.value.trim().toLowerCase();
    const correctTitle = this.originalTitle.trim().toLowerCase();

    if (!userTitleGuess) {
      alert('Inserisci un titolo prima di provare a risolvere!');
      return;
    }

    this.attempts++;

    if (userTitleGuess === correctTitle) {
      this.stopTimer();
      this.gameState = 'WIN';
      
      this.leaderboardService.saveMatch({
        username: this.username,
        category: this.selectedCategoryName,
        title: this.originalTitle,
        attempts: this.attempts,
        time: this.displayTime,
        won: true,
        previewText: this.obscuredText 
      });

      if (this.username) {
        this.gameService.clearActiveGame(this.username);
      }

    } else {
      alert('Titolo errato! La partita continua.');
    }

    inputElement.value = '';
    this.cdr.detectChanges();
  }

  abandonGame() {
    if (confirm('Vuoi arrenderti? Ti verrà svelato il titolo corretto.')) {
      this.stopTimer();
      this.gameState = 'LOSE';

      this.leaderboardService.saveMatch({
        username: this.username,
        category: this.selectedCategoryName,
        title: this.originalTitle,
        attempts: this.attempts,
        time: this.displayTime,
        won: false,
        previewText: this.obscuredText
      });

      if (this.username) {
        this.gameService.clearActiveGame(this.username);
      }

      this.cdr.detectChanges();
    }
  }

  private startTimer() {
    this.timerId = setInterval(() => {
      this.secondsElapsed++;
      this.formatTime();
      this.cdr.detectChanges();
    }, 1000);
  }

  private stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  private formatTime() {
    const minutes = Math.floor(this.secondsElapsed / 60);
    const seconds = this.secondsElapsed % 60;
    const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
    this.displayTime = `${minutesStr}:${secondsStr}`;
  }
}