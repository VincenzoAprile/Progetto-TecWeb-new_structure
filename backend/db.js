const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test di connessione immediato
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error("Errore di connessione al database:", err.message);
    } else {
        console.log("Connessione a PostgreSQL riuscita tramite db.js!");
    }
});

module.exports = pool;