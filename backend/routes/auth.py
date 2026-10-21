from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, current_app
from database import db
from models import Voter, Admin, OTPRequest
from security import (
    hash_password, check_password, generate_otp, hash_otp,
    verify_otp, generate_jwt_token, sanitize_string, validate_email,
    get_current_user_from_header
)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/voter/register', methods=['POST'])
def voter_register():
    data = request.get_json() or {}
    name = sanitize_string(data.get('name', ''), 100)
    college_id = sanitize_string(data.get('college_id', ''), 50).upper()
    email = sanitize_string(data.get('email', ''), 120).lower()
    phone = sanitize_string(data.get('phone', ''), 25)
    password = data.get('password', '')

    if not name or not college_id or not email or not password:
        return jsonify({'success': False, 'error': 'Name, College ID, Email, and Password are required'}), 400

    if not validate_email(email):
        return jsonify({'success': False, 'error': 'Invalid email address format'}), 400

    if len(password) < 6:
        return jsonify({'success': False, 'error': 'Password must be at least 6 characters long'}), 400

    if Voter.query.filter_by(college_id=college_id).first():
        return jsonify({'success': False, 'error': 'College ID is already registered'}), 409

    if Voter.query.filter_by(email=email).first():
        return jsonify({'success': False, 'error': 'Email address is already registered'}), 409

    voter = Voter(
        name=name,
        college_id=college_id,
        email=email,
        phone=phone,
        password_hash=hash_password(password),
        is_verified=False,
        has_voted=False
    )
    db.session.add(voter)
    db.session.commit()

    otp_code = generate_otp(6)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    otp_req = OTPRequest(
        voter_id=voter.id,
        otp_code_hash=hash_otp(otp_code),
        expires_at=expires_at,
        verified=False
    )
    db.session.add(otp_req)
    db.session.commit()

    response_payload = {
        'success': True,
        'message': 'Registration successful. Please verify the OTP sent to your email/phone.',
        'voter_id': voter.id,
        'email': voter.email
    }
    
    if current_app.config.get('OTP_DEV_MODE', True):
        response_payload['dev_otp'] = otp_code
        response_payload['is_dev_mode'] = True

    return jsonify(response_payload), 201

@auth_bp.route('/voter/verify-otp', methods=['POST'])
def voter_verify_otp():
    data = request.get_json() or {}
    voter_id = data.get('voter_id')
    email = sanitize_string(data.get('email', ''), 120).lower()
    otp = str(data.get('otp', '')).strip()

    if not otp:
        return jsonify({'success': False, 'error': 'OTP is required'}), 400

    voter = None
    if voter_id:
        voter = Voter.query.get(voter_id)
    elif email:
        voter = Voter.query.filter_by(email=email).first()

    if not voter:
        return jsonify({'success': False, 'error': 'Voter account not found'}), 404

    now = datetime.now(timezone.utc)
    otp_record = OTPRequest.query.filter_by(voter_id=voter.id, verified=False).order_by(OTPRequest.id.desc()).first()
    
    if not otp_record:
        return jsonify({'success': False, 'error': 'No pending OTP request found. Please request a new OTP.'}), 400

    exp = otp_record.expires_at if otp_record.expires_at.tzinfo else otp_record.expires_at.replace(tzinfo=timezone.utc)
    if exp < now:
        return jsonify({'success': False, 'error': 'OTP has expired. Please request a new one.'}), 400

    if not verify_otp(otp, otp_record.otp_code_hash):
        return jsonify({'success': False, 'error': 'Invalid OTP code. Please try again.'}), 400

    otp_record.verified = True
    voter.is_verified = True
    db.session.commit()

    token = generate_jwt_token(voter.id, 'voter')
    return jsonify({
        'success': True,
        'message': 'OTP verified successfully. You are now logged in.',
        'token': token,
        'user': voter.to_dict()
    }), 200

@auth_bp.route('/voter/resend-otp', methods=['POST'])
def voter_resend_otp():
    data = request.get_json() or {}
    voter_id = data.get('voter_id')
    email = sanitize_string(data.get('email', ''), 120).lower()

    voter = None
    if voter_id:
        voter = Voter.query.get(voter_id)
    elif email:
        voter = Voter.query.filter_by(email=email).first()

    if not voter:
        return jsonify({'success': False, 'error': 'Voter not found'}), 404

    otp_code = generate_otp(6)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    otp_req = OTPRequest(
        voter_id=voter.id,
        otp_code_hash=hash_otp(otp_code),
        expires_at=expires_at,
        verified=False
    )
    db.session.add(otp_req)
    db.session.commit()

    response_payload = {
        'success': True,
        'message': 'New OTP has been generated.',
        'voter_id': voter.id,
        'email': voter.email
    }
    if current_app.config.get('OTP_DEV_MODE', True):
        response_payload['dev_otp'] = otp_code
        response_payload['is_dev_mode'] = True

    return jsonify(response_payload), 200

@auth_bp.route('/voter/login', methods=['POST'])
def voter_login():
    data = request.get_json() or {}
    identifier = sanitize_string(data.get('identifier', ''), 120).strip()
    password = data.get('password', '')

    if not identifier or not password:
        return jsonify({'success': False, 'error': 'Voter ID/Email and Password are required'}), 400

    voter = Voter.query.filter(
        (Voter.email == identifier.lower()) | (Voter.college_id == identifier.upper())
    ).first()

    if not voter or not check_password(password, voter.password_hash):
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401

    if not voter.is_verified:
        otp_code = generate_otp(6)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        otp_req = OTPRequest(
            voter_id=voter.id,
            otp_code_hash=hash_otp(otp_code),
            expires_at=expires_at,
            verified=False
        )
        db.session.add(otp_req)
        db.session.commit()

        resp = {
            'success': False,
            'requires_otp': True,
            'message': 'Account requires OTP verification before logging in.',
            'voter_id': voter.id,
            'email': voter.email
        }
        if current_app.config.get('OTP_DEV_MODE', True):
            resp['dev_otp'] = otp_code
            resp['is_dev_mode'] = True
        return jsonify(resp), 200

    token = generate_jwt_token(voter.id, 'voter')
    return jsonify({
        'success': True,
        'message': 'Login successful',
        'token': token,
        'user': voter.to_dict()
    }), 200

@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json() or {}
    email = sanitize_string(data.get('email', ''), 120).lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'error': 'Admin Email and Password are required'}), 400

    admin = Admin.query.filter_by(email=email).first()

    if not admin or not check_password(password, admin.password_hash):
        return jsonify({'success': False, 'error': 'Invalid admin credentials'}), 401

    token = generate_jwt_token(admin.id, 'admin')
    return jsonify({
        'success': True,
        'message': 'Admin login successful',
        'token': token,
        'user': admin.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
def get_me():
    payload, err = get_current_user_from_header()
    if err:
        return jsonify({'success': False, 'error': err}), 401

    role = payload.get('role')
    user_id = payload.get('sub')

    if role == 'voter':
        voter = Voter.query.get(user_id)
        if not voter:
            return jsonify({'success': False, 'error': 'Voter not found'}), 404
        return jsonify({'success': True, 'user': voter.to_dict()}), 200
    elif role == 'admin':
        admin = Admin.query.get(user_id)
        if not admin:
            return jsonify({'success': False, 'error': 'Admin not found'}), 404
        return jsonify({'success': True, 'user': admin.to_dict()}), 200
    else:
        return jsonify({'success': False, 'error': 'Unknown role'}), 400
