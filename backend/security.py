import os
import re
import hmac
import hashlib
import random
import string
import secrets
import jwt
from functools import wraps
from datetime import datetime, timezone, timedelta
import bcrypt
from flask import request, jsonify, current_app
from models import Voter, Admin

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def check_password(password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def generate_otp(length: int = 6) -> str:
    return ''.join(random.choices(string.digits, k=length))

def hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode('utf-8')).hexdigest()

def verify_otp(otp: str, hashed_otp: str) -> bool:
    return hmac.compare_digest(hash_otp(otp), hashed_otp)

def generate_receipt_id() -> str:
    part1 = secrets.token_hex(2).upper()
    part2 = secrets.token_hex(2).upper()
    part3 = secrets.token_hex(2).upper()
    return f'VOTE-{part1}-{part2}-{part3}'

def generate_encrypted_voter_ref(voter_id: int, election_id: int) -> str:
    salt = current_app.config.get('ELECTION_SALT', 'default_salt').encode('utf-8')
    raw = f'voter:{voter_id}:election:{election_id}'.encode('utf-8')
    hashed = hmac.new(salt, raw, hashlib.sha256).hexdigest()
    return f'REF_{hashed[:32]}'

def generate_jwt_token(user_id: int, role: str, expires_in: timedelta = None) -> str:
    if expires_in is None:
        expires_in = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', timedelta(hours=4))
    
    now = datetime.now(timezone.utc)
    payload = {
        'sub': user_id,
        'role': role,
        'iat': now,
        'exp': now + expires_in
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return {'error': 'Token has expired'}
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}

def sanitize_string(val: str, max_length: int = 255) -> str:
    if not val:
        return ''
    cleaned = re.sub(r'[<>]', '', str(val).strip())
    return cleaned[:max_length]

def validate_email(email: str) -> bool:
    regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return bool(re.match(regex, email.strip()))

def get_current_user_from_header():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None, 'Authorization header missing or invalid'
    
    token = auth_header.split(' ')[1]
    payload = decode_jwt_token(token)
    
    if 'error' in payload:
        return None, payload['error']
    
    return payload, None

def voter_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        payload, err = get_current_user_from_header()
        if err:
            return jsonify({'success': False, 'error': err, 'code': 'UNAUTHORIZED'}), 401
        
        if payload.get('role') != 'voter':
            return jsonify({'success': False, 'error': 'Voter privileges required', 'code': 'FORBIDDEN'}), 403
            
        voter = Voter.query.get(payload['sub'])
        if not voter:
            return jsonify({'success': False, 'error': 'Voter account not found', 'code': 'USER_NOT_FOUND'}), 404
            
        if not voter.is_verified:
            return jsonify({'success': False, 'error': 'Voter account is not verified', 'code': 'NOT_VERIFIED'}), 403
            
        request.current_voter = voter
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        payload, err = get_current_user_from_header()
        if err:
            return jsonify({'success': False, 'error': err, 'code': 'UNAUTHORIZED'}), 401
        
        if payload.get('role') != 'admin':
            return jsonify({'success': False, 'error': 'Admin privileges required', 'code': 'FORBIDDEN'}), 403
            
        admin = Admin.query.get(payload['sub'])
        if not admin:
            return jsonify({'success': False, 'error': 'Admin account not found', 'code': 'ADMIN_NOT_FOUND'}), 404
            
        request.current_admin = admin
        return f(*args, **kwargs)
    return decorated
