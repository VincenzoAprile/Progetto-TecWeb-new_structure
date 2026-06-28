import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,  // Disattivato per evitare conflitti di sessione tra dispositivi
  workers: 1,            // Forza l'esecuzione di un solo browser alla volta
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    // L'URL dove gira la tua app Angular in locale
    baseURL: 'http://localhost:4200', 
    trace: 'on-first-retry',
  },

  /* Configurazione dei profili di visualizzazione (Viewport Responsive) */
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] }, // Risoluzione standard PC
    },
    {
      name: 'Mobile Safari (iPhone)',
      use: { ...devices['iPhone 13'] }, // Forza il viewport a 390x844 (Smartphone)
    },
    {
      name: 'Tablet Chrome (iPad)',
      use: { ...devices['Galaxy Tab S4'] }, // Forza il viewport a 712x950 (Tablet)
    },
  ],

  // Avvia Angular automaticamente prima di far partire i test
  webServer: {
    command: 'npm run start', 
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});