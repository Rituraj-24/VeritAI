# ============================================================
# db.py — SQLite Database Setup
# ============================================================
# Creates veritai.db with users + analyses tables on first run
# ============================================================

import sqlite3
import os
from flask import g

DB_PATH = os.path.join(os.path.dirname(__file__), 'veritai.db')


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute('PRAGMA journal_mode=WAL')
    return g.db


def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_db(app):
    """Create tables if they don't exist. Call once on app startup."""
    with app.app_context():
        db = sqlite3.connect(DB_PATH)
        db.row_factory = sqlite3.Row
        db.executescript('''
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                firstname     TEXT    NOT NULL,
                lastname      TEXT    NOT NULL,
                email         TEXT    NOT NULL UNIQUE,
                password_hash TEXT    NOT NULL,
                created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS analyses (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER NOT NULL REFERENCES users(id),
                input_text TEXT,
                verdict    TEXT,
                confidence REAL,
                credibility REAL,
                raw_result TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id);
            CREATE INDEX IF NOT EXISTS idx_users_email   ON users(email);
        ''')
        db.commit()
        db.close()
        print('  Database ready:', DB_PATH)
