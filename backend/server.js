const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken'); // <-- AGGIUNTO JWT
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Chiave segreta per firmare i token JWT (usa quella nel .env o una di fallback)
const JWT_SECRET = process.env.JWT_SECRET || 'super_segreto_omg_123!';

// Configurazione dei permessi (CORS) e lettura JSON
app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(express.json());

// Configurazione del collegamento a PostgreSQL usando il file .env
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// TEST IMMEDIATO DI CONNESSIONE
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error("Errore di connessione al database:", err.message);
    } else {
        console.log("Connessione a PostgreSQL riuscita! Il database risponde correttamente.");
    }
});

// --- MIDDLEWARE DI VERIFICA JWT ---
function autenticaToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Estrae il token da "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ error: 'Accesso negato. Token mancante.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token non valido o scaduto.' });
        }
        req.user = user; // Inserisce i dati decodificati del token (es. username) nella richiesta
        next();
    });
}

// --- 1. API REGISTRAZIONE ---
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username e password sono richiesti.' });
    }

    try {
        // PREPARED STATEMENT: Controllo esistenza utente
        const checkUserQuery = {
            name: 'check-user-exists',
            text: 'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
            values: [username]
        };
        const userCheck = await pool.query(checkUserQuery);
        
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Questo nome utente è già registrato.' });
        }

        // PREPARED STATEMENT: Inserimento nuovo utente
        const insertUserQuery = {
            name: 'insert-new-user',
            text: 'INSERT INTO users (username, password) VALUES ($1, $2)',
            values: [username, password]
        };
        await pool.query(insertUserQuery);
        
        console.log(`Nuovo utente registrato nel DB: ${username}`);
        return res.json({ message: 'Registrazione completata con successo!' });
    } catch (error) {
        console.error("Errore durante la registrazione:", error.message);
        return res.status(500).json({ error: 'Errore interno del server.' });
    }
});

// --- 2. API LOGIN (AGGIORNATA CON GENERAZIONE JWT) ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username e password richiesti.' });
    }

    try {
        // PREPARED STATEMENT: Verifica credenziali login
        const loginQuery = {
            name: 'user-login',
            text: 'SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND password = $2',
            values: [username, password]
        };
        const result = await pool.query(loginQuery);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenziali errate o utente non registrato.' });
        }

        const dbUsername = result.rows[0].username;

        // GENERAZIONE TOKEN JWT (Validità 2 ore)
        const token = jwt.sign({ username: dbUsername }, JWT_SECRET, { expiresIn: '2h' });

        console.log(`Login effettuato con successo da: ${dbUsername} (JWT Emesso)`);
        
        // Restituiamo sia l'username sia il Token JWT ad Angular
        return res.json({ 
            message: 'Login autorizzato', 
            username: dbUsername,
            token: token 
        });
    } catch (error) {
        console.error("Errore durante il login:", error.message);
        return res.status(500).json({ error: 'Errore durante il login.' });
    }
});

// --- 3. API SALVA PARTITA (IN CORSO) ---
app.post('/api/game/save', async (req, res) => {
    const gameState = req.body;
    const username = gameState.username;

    if (!username) {
        return res.status(400).json({ error: 'Username mancante nello stato del gioco.' });
    }

    try {
        // PREPARED STATEMENT: Upsert della partita in corso
        const saveGameQuery = {
            name: 'upsert-active-game',
            text: `
                INSERT INTO games (username, game_data) 
                VALUES ($1, $2) 
                ON CONFLICT (username) 
                DO UPDATE SET game_data = EXCLUDED.game_data;
            `,
            values: [username, JSON.stringify(gameState)]
        };
        await pool.query(saveGameQuery);
        
        console.log(`Partita salvata nel DB per l'utente: ${username}`);
        return res.json({ message: 'Stato della partita salvato con successo.' });
    } catch (error) {
        console.error("Errore nel salvataggio della partita:", error.message);
        return res.status(500).json({ error: 'Errore nel salvataggio dei dati.' });
    }
});

// --- 4. API CARICA PARTITA ---
app.get('/api/game/load/:username', async (req, res) => {
    const username = req.params.username;

    try {
        // PREPARED STATEMENT: Caricamento partita attiva
        const loadGameQuery = {
            name: 'load-active-game',
            text: 'SELECT game_data FROM games WHERE LOWER(username) = LOWER($1)',
            values: [username]
        };
        const result = await pool.query(loadGameQuery);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Nessuna partita in corso trovata per questo utente.' });
        }

        console.log(`Partita caricata dal DB per l'utente: ${username}`);
        return res.json(result.rows[0].game_data);
    } catch (error) {
        console.error("Errore nel caricamento della partita:", error.message);
        return res.status(500).json({ error: 'Errore nel recupero dei dati.' });
    }
});

// --- 5. API CANCELLA PARTITA ---
app.delete('/api/game/clear/:username', async (req, res) => {
    const username = req.params.username;

    try {
        // PREPARED STATEMENT: Cancellazione partita attiva
        const deleteGameQuery = {
            name: 'delete-active-game',
            text: 'DELETE FROM games WHERE LOWER(username) = LOWER($1)',
            values: [username]
        };
        await pool.query(deleteGameQuery);
        
        console.log(`Partita attiva rimossa dal DB per l'utente: ${username}`);
        return res.json({ message: 'Partita attiva resettata.' });
    } catch (error) {
        console.error("Errore nella cancellazione della partita:", error.message);
        return res.status(500).json({ error: 'Errore nella cancellazione.' });
    }
});

// --- 6. API SALVA PARTITA CONCLUSA (PROTETTA DA JWT) ---
app.post('/api/game/finish', autenticaToken, async (req, res) => {
    const { dettagli } = req.body;
    const username = req.user.username; // Estraiamo l'utente sicuro e verificato dal JWT!

    if (!dettagli) {
        return res.status(400).json({ error: 'Dati incompleti per salvare la partita.' });
    }

    try {
        const { category, title, attempts, time, won, previewText } = dettagli;
        const userTrimmed = username.trim();

        // [1] PREPARED STATEMENT: Salva SEMPRE nella raccolta pubblica globale (per tutti, ospiti inclusi)
        const insertCollectionQuery = {
            name: 'insert-game-collection',
            text: `
                INSERT INTO game_collection (username, category, title, attempts, time_spent, won, preview_text) 
                VALUES ($1, $2, $3, $4, $5, $6, $7);
            `,
            values: [
                userTrimmed || 'Giocatore', 
                category || '', 
                title || 'Titolo Sconosciuto', 
                attempts || 0, 
                time || '00:00', 
                won ?? false, 
                previewText || ''
            ]
        };
        await pool.query(insertCollectionQuery);

        // [2] Se l'utente è autenticato (lo è per via del JWT) E ha vinto, inserisce il record snello per il calcolo della classifica
        if (won === true) {
            const insertHistoryQuery = {
                name: 'insert-match-history',
                text: `
                    INSERT INTO match_history (username, time_spent, won) 
                    VALUES ($1, $2, $3);
                `,
                values: [userTrimmed, time || '00:00', true]
            };
            await pool.query(insertHistoryQuery);
            console.log(`Record classifica aggiunto in match_history per l'utente registrato: ${userTrimmed}`);
        }

        console.log(`Partita archiviata via JWT. Giocatore: [${userTrimmed}] - Esito: ${won ? 'VINTA' : 'PERSA'}`);
        return res.json({ message: 'Partita archiviata con successo nelle rispettive tabelle!' });
    } catch (error) {
        console.error("Errore nel salvataggio della partita conclusa:", error.message);
        return res.status(500).json({ error: 'Errore interno del server durante il salvataggio.' });
    }
});

// --- 7. API LEADERBOARD (LEGGE SOLO RECORD SNELLI DI MATCH_HISTORY) ---
app.get('/api/leaderboard', async (req, res) => {
    try {
        // PREPARED STATEMENT: Recupera solo i dati essenziali per elaborare la classifica
        const getLeaderboardQuery = {
            name: 'fetch-leaderboard-stats',
            text: `
                SELECT id, username, time_spent, won, data_partita
                FROM match_history
                ORDER BY data_partita DESC;
            `
        };
        const result = await pool.query(getLeaderboardQuery);
        return res.json(result.rows);
    } catch (error) {
        console.error("Errore nel recupero dati classifica:", error.message);
        return res.status(500).json({ error: 'Errore nel recupero dei dati statistici.' });
    }
});

// --- 8. API RACCOLTA PUBBLICA PARTITE (CRONOLOGIA COMPLETA PER TUTTI) ---
app.get('/api/game-collection', async (req, res) => {
    try {
        // PREPARED STATEMENT: Recupera lo storico totale delle partite concluse con tutti i testi di anteprima
        const getCollectionQuery = {
            name: 'fetch-public-game-collection',
            text: `
                SELECT id, username, category, title, attempts, time_spent, won, preview_text, data_partita
                FROM game_collection
                ORDER BY data_partita DESC;
            `
        };
        const result = await pool.query(getCollectionQuery);
        return res.json(result.rows);
    } catch (error) {
        console.error("Errore nel recupero della raccolta partite:", error.message);
        return res.status(500).json({ error: 'Errore nel recupero della raccolta pubblica.' });
    }
});

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server Persistente (PostgreSQL + JWT) attivo su http://localhost:${PORT}`);
});