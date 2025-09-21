const pool = require("./db");

async function logEvent(name, role, action) {
    const query = "INSERT INTO logs (name, role, action, timestamp) VALUES ($1, $2, $3, NOW())";
    await pool.query(query, [name, role, action]);
}

module.exports = { logEvent };
