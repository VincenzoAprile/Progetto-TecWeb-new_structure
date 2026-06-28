import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule], 
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  
  router = inject(Router);
  authService = inject(AuthService);

  submitted = false;
  isRegisterMode = false;

  loginForm = new FormGroup({
    user: new FormControl('', [Validators.required]),
    pass: new FormControl('', [
      Validators.required, 
      Validators.minLength(4)
    ])
  });

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.submitted = false;
    this.loginForm.reset();
  }

  async handleLogin() {
    this.submitted = true;

    const userInput = document.getElementById('user-input') as HTMLInputElement;
    const passInput = document.getElementById('pass-input') as HTMLInputElement;

    this.loginForm.patchValue({
      user: userInput ? userInput.value : '',
      pass: passInput ? passInput.value : ''
    });

    if (this.loginForm.invalid) {
      console.log('Form non valido. Controlla i dati inseriti.');
      return;
    }

    const credentials = {
      username: this.loginForm.value.user!,
      password: this.loginForm.value.pass!
    };

    if (this.isRegisterMode) {
      const result = await this.authService.registerUser(credentials);
      if (result.success) {
        alert('Registrazione completata! Ora puoi effettuare il login.');
        this.toggleMode();
      } else {
        alert(result.error || 'Errore durante la registrazione.');
      }
    } else {
      const result = await this.authService.loginUser(credentials);
      if (result.success) {
        console.log('Login effettuato con successo sul server!', result.username);
        
        // --- SALVATAGGIO CON CONTROLLO STRINGA DI TIPOSCRIPT ---
        if (result.token !== undefined) {
          localStorage.setItem('token', result.token);
        }
        if (result.username !== undefined) {
          localStorage.setItem('username', result.username);
        }
        // ----------------------------------------------------

        this.router.navigate(['/main-menu'], { state: { isGuest: false, username: result.username } }); 
      } else {
        alert(result.error || 'Credenziali errate.');
      }
    }
  }

  handleGuestLogin() {
    console.log('Accesso come utente temporaneo/guest richiesto.');
    
    // Puliamo eventuali rimasugli di vecchi token se si accede come ospite
    localStorage.removeItem('token');
    localStorage.setItem('username', 'Ospite');

    this.router.navigate(['/main-menu'], { state: { isGuest: true, username: 'Ospite' } });
  }
}