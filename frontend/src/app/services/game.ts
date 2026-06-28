import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = 'http://localhost:3000/api/game';

  constructor() {}

  private getToken(): string | null {
    const token = localStorage.getItem('token');
    return token ? token.trim() : null;
  }

  async saveCurrentGameState(state: any): Promise<void> {
    try {
      const token = this.getToken();
      const response = await fetch(`${this.apiUrl}/save`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(state)
      });
      const data = await response.json();
      console.log('Risposta server salvataggio:', data);
    } catch (error) {
      console.error('Errore nel salvataggio della partita su server:', error);
    }
  }

  async getSavedGameState(username: string): Promise<any> {
    try {
      const token = this.getToken();
      const response = await fetch(`${this.apiUrl}/load/${username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Errore nel caricamento della partita da server:', error);
      return null;
    }
  }

  async clearActiveGame(username: string): Promise<void> {
    try {
      const token = this.getToken();
      await fetch(`${this.apiUrl}/clear/${username}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Partita attiva cancellata dal server.');
    } catch (error) {
      console.error('Errore nella cancellazione della partita su server:', error);
    }
  }

  async finishGame(username: string, punteggio: number, dettagli: any = {}): Promise<boolean> {
    try {
      const token = this.getToken();
      const response = await fetch(`${this.apiUrl}/finish`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, punteggio, detalles: dettagli })
      });
      
      if (!response.ok) return false;
      console.log('Partita conclusa salvata nel DB storico.');
      return true;
    } catch (error) {
      console.error('Errore di rete nel salvataggio della partita conclusa:', error);
      return false;
    }
  }
}