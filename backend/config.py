import os
import base64
from datetime import timedelta
from dotenv import load_dotenv
from cryptography.fernet import Fernet

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key_voting_2026_dev')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'default_jwt_secret_key_voting_2026_dev')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=4)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    
    # AES Encryption Key (Fernet key)
    raw_aes_key = os.getenv('AES_ENCRYPTION_KEY')
    if not raw_aes_key:
        # Fallback generated Fernet key
        AES_ENCRYPTION_KEY = Fernet.generate_key().decode('utf-8')
    else:
        AES_ENCRYPTION_KEY = raw_aes_key

    ELECTION_SALT = os.getenv('ELECTION_SALT', 'default_election_salt_voting_2026')
    
    # Database
    db_url = os.getenv('DATABASE_URL', 'sqlite:///voting_app.db')
    # Support postgres:// URL format by rewriting to postgresql://
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Dev Mode OTP fallback
    OTP_DEV_MODE = os.getenv('OTP_DEV_MODE', 'True').lower() in ('true', '1', 't')
    
    # Rate Limiting storage
    RATELIMIT_STORAGE_URI = 'memory://'
    RATELIMIT_STRATEGY = 'fixed-window'
