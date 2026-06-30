const express = require('express');
const router = express.Router();
const pool = require('../db');

// --- 3. API SALVA PARTITA (IN CORSO) ---
router.post('/save', async (req, res) => {
    const gameState = req.body;
    const username = gameState.username;

    if (!username) {
        return res.status(400).json({ error: 'Username mancante nello stato del gioco.' });
    }

    try {
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
router.get('/load/:username', async (req, res) => {
    const username = req.params.username;

    try {
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
router.delete('/clear/:username', async (req, res) => {
    const username = req.params.username;

    try {
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

module.exports = router;