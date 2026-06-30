// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importiamo i router che abbiamo appena creato
const authRouter = require('./routes/auth');
const gameRouter = require('./routes/game');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurazione Globali (CORS e parsing JSON)
app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(express.json());

// --- SMISTAMENTO DELLE ROTTE ---
// Colleghiamo i file esterni aggiungendo i prefissi corretti
app.use('/api', authRouter);        // Gestirà /api/register e /api/login
app.use('/api/game', gameRouter);   // Gestirà /api/game/save, /api/game/load/:username, /api/game/clear/:username
app.use('/api', statsRouter);        // Gestirà /api/game/finish, /api/leaderboard, /api/game-collection

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server Modulare attivo ed elegantemente diviso su http://localhost:${PORT}`);
});