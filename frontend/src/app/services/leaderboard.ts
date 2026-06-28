import { Injectable } from '@angular/core';

export interface GameMatch {
  username: string;
  category: string;
  title: string;
  attempts: number;
  time: string; 
  won: boolean;
  previewText?: string;
  date?: string;
}

export interface LeaderboardRow {
  username: string;
  gamesWon: number;
  averageTime: string;
  averageSeconds: number;
}

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  private apiUrl = 'http://localhost:3000/api';

  constructor() { }

  private getToken(): string | null {
    const token = localStorage.getItem('token');
    return token ? token.trim() : null;
  }

  // Scarica lo storico dei match allegando il JWT
  async getMatches(): Promise<GameMatch[]> {
    try {
      const token = this.getToken();
      const response = await fetch(`${this.apiUrl}/game-collection`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) return [];
      const rows = await response.json();
      
      return rows.map((r: any) => ({
        username: r.username,
        category: r.category || '',
        title: r.title || '',
        attempts: r.attempts || 0,
        time: r.time_spent || '00:00',
        won: r.won ?? false,
        previewText: r.preview_text || '',
        date: r.data_partita ? new Date(r.data_partita).toLocaleString('it-IT') : ''
      }));
    } catch (error) {
      console.error('Errore nel recupero dei match:', error);
      return [];
    }
  }

  // Invia la partita conclusa allegando il JWT
  async saveMatch(match: GameMatch): Promise<void> {
    try {
      const token = this.getToken();
      await fetch(`${this.apiUrl}/game/finish`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dettagli: {
            category: match.category,
            title: match.title,
            attempts: match.attempts,
            time: match.time, 
            won: match.won,
            previewText: match.previewText
          }
        })
      });
      console.log('Match inviato correttamente con autenticazione JWT.');
    } catch (error) {
      console.error('Errore durante il salvataggio del match nel DB:', error);
    }
  }

  async getCalculatedLeaderboard(): Promise<LeaderboardRow[]> {
    const allMatches = await this.getMatches();
    const userStats: { [username: string]: { totalSeconds: number, wonCount: number } } = {};

    allMatches.forEach(match => {
      if (!match || !match.username) return;
      const userTrimmed = match.username.trim();
      const userLower = userTrimmed.toLowerCase();
      
      if (['', 'giocatore', 'ospite', 'anonimo'].includes(userLower)) return;

      if (!userStats[userTrimmed]) {
        userStats[userTrimmed] = { totalSeconds: 0, wonCount: 0 };
      }

      const hasWon = match.won === true || (match.won as any) === 'true';
      if (hasWon) {
        userStats[userTrimmed].wonCount++;
        userStats[userTrimmed].totalSeconds += this.timeToSeconds(match.time);
      }
    });

    const leaderboard: LeaderboardRow[] = Object.keys(userStats).map(username => {
      const stats = userStats[username];
      const avgSeconds = stats.wonCount > 0 ? Math.round(stats.totalSeconds / stats.wonCount) : 0;
      return {
        username: username,
        gamesWon: stats.wonCount,
        averageSeconds: avgSeconds,
        averageTime: this.secondsToTime(avgSeconds)
      };
    });

    return leaderboard.filter(row => row.gamesWon > 0).sort((a, b) => {
      if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
      return a.averageSeconds - b.averageSeconds;
    });
  }

  private timeToSeconds(timeStr: string): number {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const parts = timeStr.trim().split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  }

  private secondsToTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
}