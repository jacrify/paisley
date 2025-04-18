const BankDatabase = require('./BankDatabase');

class KeyValueStore {
  constructor() {
    const dbInstance = new BankDatabase();
    this.db = dbInstance.db;
    this.initialize();
  }

  initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS store (
        namespace TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        PRIMARY KEY (namespace, key)
      )
    `);
  }

  getKey(namespace, key) {
    try {
      const stmt = this.db.prepare('SELECT value FROM store WHERE namespace = ? AND key = ?');
      const row = stmt.get(namespace, key);
      return row ? row.value : null; // Return the value if found, otherwise null
    } catch (err) {
      throw new Error(`Database error: ${err.message}`);
    }
  }

  setKey(namespace, key, value) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO store (namespace, key, value)
        VALUES (?, ?, ?)
        ON CONFLICT(namespace, key) DO UPDATE SET value = excluded.value
      `);
      stmt.run(namespace, key, value);
      return { message: 'Key upserted successfully' };
    } catch (err) {
      throw new Error(`Database upsert error: ${err.message}`);
    }
  }
  
  listKeys(namespace) {
    try {
      const stmt = this.db.prepare('SELECT key, value FROM store WHERE namespace = ?');
      const rows = stmt.all(namespace);
      return rows;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  updateKey(namespace, key, value) {
    try {
      const stmt = this.db.prepare('UPDATE store SET value = ? WHERE namespace = ? AND key = ?');
      stmt.run(value, namespace, key);
      return { message: 'Key updated successfully' };
    } catch (err) {
      throw new Error(err.message);
    }
  }

  deleteKey(namespace, key) {
    try {
      const stmt = this.db.prepare('DELETE FROM store WHERE namespace = ? AND key = ?');
      stmt.run(namespace, key);
      return { message: 'Key deleted successfully' };
    } catch (err) {
      throw new Error(err.message);
    }
  }
}

module.exports = KeyValueStore;
