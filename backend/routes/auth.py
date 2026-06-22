# ============================================================
# routes/auth.py — Production Authentication
# ============================================================
# Uses: bcrypt (password hashing), PyJWT (tokens), SQLite (db)
# ============================================================

from flask import Blueprint, request, jsonify
import bcrypt
import jwt
import datetime
import os
from db import get_db

auth_bp = Blueprint('auth', __name__)
JWT_SECRET = os.getenv('JWT_SECRET', 'veritai-super-secret-change-in-production')
JWT_EXPIRY_HOURS = 24


def auth_log(message):
    print(f"[auth] {message}")


def make_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRY_HOURS),
        'iat': datetime.datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


def verify_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_current_user():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ', 1)[1]
    payload = verify_token(token)
    if not payload:
        return None
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (payload['user_id'],)).fetchone()
    return dict(user) if user else None


# ——— REGISTER ———
@auth_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    firstname = (data.get('firstname') or '').strip()
    lastname  = (data.get('lastname')  or '').strip()
    email     = (data.get('email')     or '').strip().lower()
    password  = (data.get('password')  or '')

    auth_log(f"register attempt email={email or '<empty>'}")

    if not all([firstname, lastname, email, password]):
        auth_log("register rejected: missing fields")
        return jsonify({'error': 'All fields are required'}), 400
    if len(password) < 8:
        auth_log(f"register rejected: weak password email={email}")
        return jsonify({'error': 'Password must be at least 8 characters'}), 400
    if '@' not in email:
        auth_log(f"register rejected: invalid email email={email}")
        return jsonify({'error': 'Invalid email address'}), 400

    db = get_db()
    existing = db.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
    if existing:
        auth_log(f"register rejected: duplicate email={email}")
        return jsonify({'error': 'An account with this email already exists'}), 409

    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    cursor = db.execute(
        'INSERT INTO users (firstname, lastname, email, password_hash) VALUES (?, ?, ?, ?)',
        (firstname, lastname, email, password_hash)
    )
    db.commit()
    user_id = cursor.lastrowid
    token = make_token(user_id)
    auth_log(f"register success user_id={user_id} email={email}")

    return jsonify({
        'token': token,
        'user': {
            'id': user_id,
            'firstname': firstname,
            'lastname': lastname,
            'email': email
        }
    }), 201


# ——— LOGIN ———
@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email    = (data.get('email')    or '').strip().lower()
    password = (data.get('password') or '')

    auth_log(f"login attempt email={email or '<empty>'}")

    if not email or not password:
        auth_log("login rejected: missing email or password")
        return jsonify({'error': 'Email and password are required'}), 400

    db = get_db()
    user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()

    if not user:
        auth_log(f"login rejected: user not found email={email}")
        return jsonify({'error': 'Invalid email or password'}), 401

    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        auth_log(f"login rejected: bad password email={email}")
        return jsonify({'error': 'Invalid email or password'}), 401

    token = make_token(user['id'])
    auth_log(f"login success user_id={user['id']} email={email}")

    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'firstname': user['firstname'],
            'lastname': user['lastname'],
            'email': user['email']
        }
    }), 200


# ——— GET CURRENT USER (verify token) ———
@auth_bp.route('/auth/me', methods=['GET'])
def me():
    user = get_current_user()
    if not user:
        auth_log("me rejected: unauthorized")
        return jsonify({'error': 'Unauthorized'}), 401
    auth_log(f"me success user_id={user['id']} email={user['email']}")
    return jsonify({
        'id': user['id'],
        'firstname': user['firstname'],
        'lastname': user['lastname'],
        'email': user['email']
    }), 200


# ——— LOGOUT (client just deletes token, but this invalidates on server side optionally) ———
@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200
