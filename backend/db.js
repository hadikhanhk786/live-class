const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    user: "hahikhan",
    host: "localhost",
    database: "postgres",
    password: "",
    port: 5432,
});

// Test the connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Connected to PostgreSQL database');
    release();
});

module.exports = pool;
