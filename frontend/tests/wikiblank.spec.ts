import { test, expect } from '@playwright/test';

test('1. Apertura corretta della pagina di login ed elementi principali', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#user-input')).toBeVisible();
  await expect(page.locator('#pass-input')).toBeVisible();
  await expect(page.locator('.btn-submit')).toBeVisible();
});

test('2. Passaggio dinamico alla modalità Registrazione', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('.toggle-link').click();
  await expect(page.locator('h2')).toContainText('Crea un Account');
});

test('3. Attivazione dei validatori Angular al click su campi vuoti', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('.btn-submit').click();
  await expect(page.locator('.error-message').first()).toBeVisible();
});

test('4. Accesso riuscito con credenziali reali e superamento del login', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Inseriamo le tue credenziali reali
  await page.locator('#user-input').fill('mike');
  await page.locator('#pass-input').fill('1234');
  await page.waitForTimeout(200);

  // Clicchiamo su "Inizia la sessione" per fare il login vero
  await page.locator('.btn-submit').click();
  await page.waitForTimeout(1500);
  
  const bodyText = await page.locator('body').innerText();
  expect(bodyText).not.toContain("Accedi all'App");
});

test('5. Navigazione verso la schermata di scelta categoria', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('#user-input').fill('mike');
  await page.locator('#pass-input').fill('1234');
  await page.locator('.btn-submit').click();
  
  // Aspetta che la login card sparisca dal DOM prima di cercare il menu
  await page.waitForSelector('.login-card', { state: 'detached', timeout: 5000 });

  // Clicca sul pulsante del Menu Principale usando il testo reale
  const menuPlayBtn = page.locator('button', { hasText: /gioca|nuova partita|inizia|avvia/i }).first();
  await menuPlayBtn.click();
  await page.waitForTimeout(1000);

  await expect(page.locator('h2')).toContainText('Scegli una Categoria');
});

test('6. Attivazione del Loader Wikipedia al click su una categoria', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('#user-input').fill('mike');
  await page.locator('#pass-input').fill('1234');
  await page.locator('.btn-submit').click();
  await page.waitForSelector('.login-card', { state: 'detached', timeout: 5000 });
  
  await page.locator('button', { hasText: /gioca|nuova partita|inizia|avvia/i }).first().click();
  await page.waitForTimeout(1000);

  await page.locator('.btn-games').click();
  await expect(page.locator('.sub-loader')).toContainText("Sto estraendo un articolo a sorte per te");
});

test('7. Caricamento della schermata Fase di Gioco e statistiche', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('#user-input').fill('mike');
  await page.locator('#pass-input').fill('1234');
  await page.locator('.btn-submit').click();
  await page.waitForSelector('.login-card', { state: 'detached', timeout: 5000 });
  
  await page.locator('button', { hasText: /gioca|nuova partita|inizia|avvia/i }).first().click();
  await page.waitForTimeout(1000);
  await page.locator('.btn-games').click();

  await page.waitForSelector('.game-stats', { timeout: 15000 });
  await expect(page.locator('h2')).toContainText('Fase di Gioco');
});

test('8. Interazione con il campo inserimento Parola in partita', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('#user-input').fill('mike');
  await page.locator('#pass-input').fill('1234');
  await page.locator('.btn-submit').click();
  await page.waitForSelector('.login-card', { state: 'detached', timeout: 5000 });
  
  await page.locator('button', { hasText: /gioca|nuova partita|inizia|avvia/i }).first().click();
  await page.waitForTimeout(1000);
  await page.locator('.btn-games').click();

  await page.waitForSelector('#word-guess', { timeout: 15000 });
  await page.locator('#word-guess').fill('computer');
  await page.locator('.btn-submit').click();
});

test('9. Interazione con il campo Risoluzione Titolo', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('#user-input').fill('mike');
  await page.locator('#pass-input').fill('1234');
  await page.locator('.btn-submit').click();
  await page.waitForSelector('.login-card', { state: 'detached', timeout: 5000 });
  
  await page.locator('button', { hasText: /gioca|nuova partita|inizia|avvia/i }).first().click();
  await page.waitForTimeout(1000);
  await page.locator('.btn-games').click();

  await page.waitForSelector('#title-guess', { timeout: 15000 });
  await page.locator('#title-guess').fill('Minecraft');
  await expect(page.locator('.btn-victory')).toBeVisible();
});

test('10. Funzionamento del bottone Abbandona e comparsa risultati', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('#user-input').fill('mike');
  await page.locator('#pass-input').fill('1234');
  await page.locator('.btn-submit').click();
  await page.waitForSelector('.login-card', { state: 'detached', timeout: 5000 });
  
  await page.locator('button', { hasText: /gioca|nuova partita|inizia|avvia/i }).first().click();
  await page.waitForTimeout(1000);
  await page.locator('.btn-games').click();

  await page.waitForSelector('.btn-abandon', { timeout: 15000 });
  
  page.once('dialog', async dialog => {
    await dialog.accept();
  });

  await page.locator('.btn-abandon').click();
  await page.waitForSelector('app-game-result', { timeout: 4000 });
  await expect(page.locator('app-game-result')).toBeVisible();
});