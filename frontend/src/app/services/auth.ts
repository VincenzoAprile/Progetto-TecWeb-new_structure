import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';

  constructor() {}
  
  // Recupera il token dal localStorage ripulendolo da spazi o ritorni a capo
  getToken(): string | null {
    const token = localStorage.getItem('token');
    return token ? token.trim() : null;
  }

  // Genera l'oggetto headers con il Bearer Token corretto
  getHeaders(): { [key: string]: string } {
    const token = this.getToken();
    const headers: { [key: string]: string } = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async registerUser(credentials: any): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error };
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Impossibile connettersi al server.' };
    }
  }

  async loginUser(credentials: any): Promise<{ success: boolean; username?: string; token?: string; error?: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();
      if (!response.ok) return { success: false, error: data.error };
      
      // Salva il token e lo username nel localStorage al login
      if (data.token) {
        localStorage.setItem('token', data.token.trim());
        localStorage.setItem('username', data.username || '');
      }
      
      return { success: true, username: data.username, token: data.token };
    } catch (error) {
      return { success: false, error: 'Impossibile connettersi al server.' };
    }
  }

  logoutUser(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  }
}