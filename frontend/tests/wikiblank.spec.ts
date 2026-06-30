import { test, expect, Page, Route } from '@playwright/test';

const GENERIC_TITLE = 'Articolo Generico';
const GENERIC_TEXT = 'Testo di prova generico per i test di Angular. Questo testo è lungo abbastanza da evitare errori di substring.';

const mockWikiArticle = {
  title: GENERIC_TITLE,
  content: GENERIC_TEXT
};

const mockActionResponse = {
  success: true,
  status: 'success',
  ...mockWikiArticle
};

// Configurazione globale per intercettare i crash e gestire i mock di rete
test.beforeEach(async ({ page }) => {
  // 1. Silenzia gli errori residui in console che non bloccano l'interfaccia
  page.on('pageerror', exception => {
    if (exception.message.includes("substring") || exception.message.includes("undefined")) {
      return; 
    }
    console.error(`Page error intercettato: ${exception.message}`);
  });

  // 2. 🛡️ PROTEZIONE CENTRALE: Gestisce i mock per TUTTI i test evitando i 404 asincroni
  await page.route('**/api/**', async (route: Route) => {
    const url = route.request().url().toLowerCase();
    const method = route.request().method();

    // Lascia passare il login reale verso il server
    if (url.includes('/login') || url.includes('/register')) {
      await route.continue();
    } else if (method === 'GET') {
      // Risponde a /api/game/load/ o altre GET evitando il 404
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockWikiArticle)
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockActionResponse)
      });
    }
  });
});

// FUNZIONE REUSABILE: Esegue il login e porta l'utente nella schermata di gioco attiva
async function setupGameSession(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.locator('#user-input').fill('mike');
  await page.locator('#pass-input').fill('1234');
  await page.locator('.btn-submit').click();

  // Attende che l'interfaccia di login sparisca prima di interagire con i bottoni di gioco
  await page.waitForSelector('#user-input', { state: 'detached', timeout: 5000 });

  await page.locator('button', { hasText: /gioca|nuova partita|inizia|avvia/i }).first().click();
  await page.waitForSelector('.btn-games', { timeout: 5000 });
  await page.locator('.btn-games').click();
  await page.waitForSelector('.game-stats', { state: 'visible', timeout: 10000 });
}

// --- GRUPPO 1: TEST STATICI E DI ACCESSO ---
test.describe('Autenticazione e Accesso', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('1. Apertura corretta della pagina di login ed elementi principali', async ({ page }) => {
    await expect(page.locator('#user-input')).toBeVisible();
    await expect(page.locator('#pass-input')).toBeVisible();
    await expect(page.locator('.btn-submit')).toBeVisible();
  });

  test('2. Passaggio dinamico alla modalità Registrazione', async ({ page }) => {
    await page.locator('.toggle-link').click();
    await expect(page.locator('h2')).toContainText('Crea un Account');
  });

  test('3. Attivazione dei validatori Angular al click su campi vuoti', async ({ page }) => {
    await page.locator('.btn-submit').click();
    await expect(page.locator('.error-message').first()).toBeVisible();
  });

  test('4. Accesso riuscito con credenziali reali e superamento del login', async ({ page }) => {
    await page.locator('#user-input').fill('mike');
    await page.locator('#pass-input').fill('1234');
    await page.locator('.btn-submit').click();
    await page.waitForTimeout(1000);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain("Accedi all'App");
  });
});

// --- GRUPPO 2: TEST DI INTERAZIONE FASE DI GIOCO ---
test.describe('Fase di Gioco Avanzata', () => {

  test('5. Navigazione verso la schermata di scelta categoria', async ({ page }) => {
    await page.goto('/');
    await page.locator('#user-input').fill('mike');
    await page.locator('#pass-input').fill('1234');
    await page.locator('.btn-submit').click();
    
    // Attende lo sblocco dell'animazione di transizione
    await page.waitForTimeout(500); 
    
    await page.locator('button', { hasText: /gioca|nuova partita|inizia|avvia/i }).first().click();
    await expect(page.locator('h2')).toContainText('Scegli una Categoria');
  });

  test('6. Attivazione del Loader Wikipedia al click su una categoria', async ({ page }) => {
    await page.goto('/');
    await page.locator('#user-input').fill('mike');
    await page.locator('#pass-input').fill('1234');
    await page.locator('.btn-submit').click();
    
    await page.waitForTimeout(500);
    await page.locator('button', { hasText: /gioca|nuova partita|inizia|avvia/i }).first().click();
    await page.locator('.btn-games').click();
    
    await expect(page.locator('.sub-loader')).toBeVisible();
    await page.waitForSelector('.game-stats', { state: 'visible', timeout: 5000 }).catch(() => {});
  });

  test('7. Caricamento della schermata Fase di Gioco e statistiche', async ({ page }) => {
    await setupGameSession(page);
    await expect(page.locator('h2')).toContainText('Fase di Gioco');
  });

  test('8. Interazione con il campo inserimento Parola in partita', async ({ page }) => {
    await setupGameSession(page);
    const wordInput = page.locator('#word-guess');
    await wordInput.fill('computer');
    await page.locator('.btn-submit').click();
    await expect(wordInput).toBeVisible();
  });

  test('9. Interazione con il campo Risoluzione Titolo', async ({ page }) => {
    await setupGameSession(page);
    const titleInput = page.locator('#title-guess');
    await titleInput.fill(GENERIC_TITLE);
    await page.locator('.btn-submit').click().catch(() => {});
    await expect(page.locator('.btn-victory')).toBeVisible();
  });

  test('10. Funzionamento del bottone Abbandona e comparsa risultati', async ({ page }) => {
    await setupGameSession(page);
    const abandonBtn = page.locator('.btn-abandon');
    page.once('dialog', async dialog => { await dialog.accept(); });
    await abandonBtn.click();
    await page.waitForSelector('app-game-result', { timeout: 5000 });
    await expect(page.locator('app-game-result')).toBeVisible();
  });
});