const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./contacts.db');

db.serialize(() => {
    // Create a table for contacts
    db.run(`CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY, name TEXT, phone TEXT)`);
});

module.exports = db;