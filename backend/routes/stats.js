const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_segreto_omg_123!';

// MIDDLEWARE DI VERIFICA JWT LOCALIZZATO
function autenticaToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Accesso negato. Token mancante.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token non valido o scaduto.' });
        }
        req.user = user;
        next();
    });
}

// --- 6. API SALVA PARTITA CONCLUSA ---
router.post('/finish', autenticaToken, async (req, res) => {
    const { dettagli } = req.body;
    const username = req.user.username;

    if (!dettagli) {
        return res.status(400).json({ error: 'Dati incompleti per salvare la partita.' });
    }

    try {
        const { category, title, attempts, time, won, previewText } = dettagli;
        const userTrimmed = username.trim();

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
        }

        return res.json({ message: 'Partita archiviata con successo nelle rispettive tabelle!' });
    } catch (error) {
        console.error("Errore nel salvataggio della partita conclusa:", error.message);
        return res.status(500).json({ error: 'Errore interno del server durante il salvataggio.' });
    }
});

// --- 7. API LEADERBOARD ---
router.get('/leaderboard', async (req, res) => {
    try {
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

// --- 8. API RACCOLTA PUBBLICA PARTITE ---
router.get('/game-collection', async (req, res) => {
    try {
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

module.exports = router;