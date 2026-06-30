const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db'); // Importa la connessione centralizzata

const JWT_SECRET = process.env.JWT_SECRET;

// --- 1. API REGISTRAZIONE ---
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username e password sono richiesti.' });
    }

    try {
        const checkUserQuery = {
            name: 'check-user-exists',
            text: 'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
            values: [username]
        };
        const userCheck = await pool.query(checkUserQuery);
        
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Questo nome utente è già registrato.' });
        }

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

// --- 2. API LOGIN ---
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username e password richiesti.' });
    }

    try {
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
        const token = jwt.sign({ username: dbUsername }, JWT_SECRET, { expiresIn: '2h' });

        console.log(`Login effettuato con successo da: ${dbUsername} (JWT Emesso)`);
        
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

module.exports = router;