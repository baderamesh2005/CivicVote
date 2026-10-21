import pytest
from sqlalchemy.pool import StaticPool
from app import create_app
from database import db
from models import Voter, Admin, OTPRequest
from config import Config

class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {'check_same_thread': False},
        'poolclass': StaticPool
    }
    OTP_DEV_MODE = True

@pytest.fixture
def client():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()

def test_voter_registration_and_otp_verification(client):
    reg_resp = client.post('/api/auth/voter/register', json={
        'name': 'Jane Doe',
        'college_id': 'CS-2026-99',
        'email': 'jane.doe@university.edu',
        'phone': '1234567890',
        'password': 'SecurePassword123!'
    })
    assert reg_resp.status_code == 201
    data = reg_resp.get_json()
    assert data['success'] is True
    assert 'dev_otp' in data
    voter_id = data['voter_id']
    dev_otp = data['dev_otp']

    dup_resp = client.post('/api/auth/voter/register', json={
        'name': 'Jane Duplicate',
        'college_id': 'CS-2026-99',
        'email': 'jane.doe@university.edu',
        'password': 'SecurePassword123!'
    })
    assert dup_resp.status_code == 409

    bad_otp_resp = client.post('/api/auth/voter/verify-otp', json={
        'voter_id': voter_id,
        'otp': '000000'
    })
    assert bad_otp_resp.status_code == 400

    good_otp_resp = client.post('/api/auth/voter/verify-otp', json={
        'voter_id': voter_id,
        'otp': dev_otp
    })
    assert good_otp_resp.status_code == 200
    verify_data = good_otp_resp.get_json()
    assert 'token' in verify_data
    assert verify_data['user']['is_verified'] is True

    login_resp = client.post('/api/auth/voter/login', json={
        'identifier': 'jane.doe@university.edu',
        'password': 'SecurePassword123!'
    })
    assert login_resp.status_code == 200
    login_data = login_resp.get_json()
    assert 'token' in login_data

def test_admin_login(client):
    from security import hash_password
    with client.application.app_context():
        admin = Admin(
            name='Super Admin',
            email='admin@test.org',
            password_hash=hash_password('AdminPass123!')
        )
        db.session.add(admin)
        db.session.commit()

    resp = client.post('/api/auth/admin/login', json={
        'email': 'admin@test.org',
        'password': 'AdminPass123!'
    })
    assert resp.status_code == 200
    assert 'token' in resp.get_json()

    bad_resp = client.post('/api/auth/admin/login', json={
        'email': 'admin@test.org',
        'password': 'WrongPassword'
    })
    assert bad_resp.status_code == 401
