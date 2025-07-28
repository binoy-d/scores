const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'svic_scores.db');

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('📴 Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async initializeTables() {
    const queries = [
      // Players table
      `CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        elo_rating INTEGER DEFAULT 1200,
        is_admin BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Matches table
      `CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player1_id INTEGER NOT NULL,
        player2_id INTEGER NOT NULL,
        player1_score INTEGER NOT NULL,
        player2_score INTEGER NOT NULL,
        winner_id INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        confirmed_at DATETIME,
        FOREIGN KEY (player1_id) REFERENCES players (id),
        FOREIGN KEY (player2_id) REFERENCES players (id),
        FOREIGN KEY (winner_id) REFERENCES players (id)
      )`,

      // Match requests table
      `CREATE TABLE IF NOT EXISTS match_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        requesting_player_id INTEGER NOT NULL,
        confirming_player_id INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        responded_at DATETIME,
        FOREIGN KEY (match_id) REFERENCES matches (id),
        FOREIGN KEY (requesting_player_id) REFERENCES players (id),
        FOREIGN KEY (confirming_player_id) REFERENCES players (id)
      )`,

      // Create indexes for better performance
      `CREATE INDEX IF NOT EXISTS idx_players_username ON players (username)`,
      `CREATE INDEX IF NOT EXISTS idx_players_email ON players (email)`,
      `CREATE INDEX IF NOT EXISTS idx_matches_players ON matches (player1_id, player2_id)`,
      `CREATE INDEX IF NOT EXISTS idx_matches_status ON matches (status)`,
      `CREATE INDEX IF NOT EXISTS idx_match_requests_status ON match_requests (status)`,
      `CREATE INDEX IF NOT EXISTS idx_match_requests_confirming ON match_requests (confirming_player_id, status)`
    ];

    for (const query of queries) {
      await this.run(query);
    }
    
    console.log('✅ Database tables initialized');
  }
}

const database = new Database();

module.exports = database;
