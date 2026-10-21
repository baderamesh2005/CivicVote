import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy.pool import StaticPool
from app import create_app
from database import db
from models import Voter, Admin, Election, Candidate, Vote
from security import hash_password, generate_jwt_token
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
def app_and_client():
    app = create_app(TestConfig)
    with app.app_context():
        db.drop_all()
        db.create_all()
        now = datetime.now(timezone.utc)
        
        # Election 1: Presidential Election
        e1 = Election(
            title='Presidential Election 2026',
            role_category='President',
            description='Executive leadership election',
            start_time=now - timedelta(hours=1),
            end_time=now + timedelta(days=5),
            is_active=True
        )
        # Election 2: General Secretary Election
        e2 = Election(
            title='General Secretary Election 2026',
            role_category='Secretary',
            description='Secretariat leadership election',
            start_time=now - timedelta(hours=1),
            end_time=now + timedelta(days=5),
            is_active=True
        )
        db.session.add_all([e1, e2])
        db.session.commit()

        c1_e1 = Candidate(election_id=e1.id, name='Candidate Sarah', party='Tech Slate', bio='Tech bio', photo_url='')
        c2_e1 = Candidate(election_id=e1.id, name='Candidate Marcus', party='Welfare Slate', bio='Welfare bio', photo_url='')
        c1_e2 = Candidate(election_id=e2.id, name='Candidate Priya', party='Green Slate', bio='Green bio', photo_url='')
        db.session.add_all([c1_e1, c2_e1, c1_e2])

        voter1 = Voter(
            name='Voter One',
            college_id='V1-2026',
            email='voter1@test.edu',
            password_hash=hash_password('Pass123!'),
            is_verified=True,
            has_voted=False
        )
        voter2 = Voter(
            name='Voter Two',
            college_id='V2-2026',
            email='voter2@test.edu',
            password_hash=hash_password('Pass123!'),
            is_verified=True,
            has_voted=False
        )
        admin = Admin(
            name='Admin User',
            email='admin@test.org',
            password_hash=hash_password('AdminPass123!')
        )
        db.session.add_all([voter1, voter2, admin])
        db.session.commit()

        e1_id = e1.id
        e2_id = e2.id
        c1_e1_id = c1_e1.id
        c2_e1_id = c2_e1.id
        c1_e2_id = c1_e2.id
        v1_id = voter1.id
        v2_id = voter2.id
        adm_id = admin.id

        yield app, app.test_client(), e1_id, e2_id, c1_e1_id, c2_e1_id, c1_e2_id, v1_id, v2_id, adm_id
        
        db.session.remove()
        db.drop_all()

def test_multi_election_independent_voting_and_single_vote_enforcement(app_and_client):
    app, client, e1_id, e2_id, c1_e1_id, c2_e1_id, c1_e2_id, v1_id, v2_id, admin_id = app_and_client

    with app.app_context():
        token1 = generate_jwt_token(v1_id, 'voter')

    headers = {'Authorization': f'Bearer {token1}'}

    # 1. Cast vote in Election 1 (President)
    vote1_resp = client.post('/api/vote/cast', json={'candidate_id': c1_e1_id, 'election_id': e1_id}, headers=headers)
    assert vote1_resp.status_code == 201
    data1 = vote1_resp.get_json()
    assert data1['success'] is True
    assert data1['receipt_id'].startswith('VOTE-')

    # 2. Try to double-vote in Election 1 (President) -> MUST BE REJECTED
    double_vote_resp = client.post('/api/vote/cast', json={'candidate_id': c2_e1_id, 'election_id': e1_id}, headers=headers)
    assert double_vote_resp.status_code == 409
    assert double_vote_resp.get_json()['code'] == 'ALREADY_VOTED'

    # 3. Voter CAN still cast a vote in Election 2 (Secretary)
    vote2_resp = client.post('/api/vote/cast', json={'candidate_id': c1_e2_id, 'election_id': e2_id}, headers=headers)
    assert vote2_resp.status_code == 201
    data2 = vote2_resp.get_json()
    assert data2['success'] is True

    # 4. Check vote status for each election
    st1 = client.get(f'/api/vote/status?election_id={e1_id}', headers=headers).get_json()
    assert st1['has_voted'] is True
    st2 = client.get(f'/api/vote/status?election_id={e2_id}', headers=headers).get_json()
    assert st2['has_voted'] is True

def test_voting_blocked_when_election_closed(app_and_client):
    app, client, e1_id, e2_id, c1_e1_id, c2_e1_id, c1_e2_id, v1_id, v2_id, admin_id = app_and_client

    with app.app_context():
        admin_token = generate_jwt_token(admin_id, 'admin')
        voter_token = generate_jwt_token(v2_id, 'voter')

    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    voter_headers = {'Authorization': f'Bearer {voter_token}'}

    # Admin updates election window to past dates
    now = datetime.now(timezone.utc)
    st = (now - timedelta(days=10)).isoformat()
    et = (now - timedelta(days=2)).isoformat()

    update_resp = client.put(f'/api/admin/elections/{e1_id}', json={
        'start_time': st,
        'end_time': et
    }, headers=admin_headers)
    assert update_resp.status_code == 200

    # Voter attempts to vote in expired election -> MUST BE REJECTED (400)
    resp = client.post('/api/vote/cast', json={'candidate_id': c1_e1_id, 'election_id': e1_id}, headers=voter_headers)
    assert resp.status_code == 400
    assert resp.get_json()['code'] == 'ELECTION_CLOSED'

def test_admin_dashboard_and_csv_export(app_and_client):
    app, client, e1_id, e2_id, c1_e1_id, c2_e1_id, c1_e2_id, v1_id, v2_id, admin_id = app_and_client

    with app.app_context():
        v1_token = generate_jwt_token(v1_id, 'voter')
        admin_token = generate_jwt_token(admin_id, 'admin')

    client.post('/api/vote/cast', json={'candidate_id': c1_e1_id, 'election_id': e1_id}, headers={'Authorization': f'Bearer {v1_token}'})

    admin_headers = {'Authorization': f'Bearer {admin_token}'}

    dash_resp = client.get(f'/api/admin/dashboard?election_id={e1_id}', headers=admin_headers)
    assert dash_resp.status_code == 200
    stats = dash_resp.get_json()['stats']
    assert stats['total_votes_cast'] == 1
    assert stats['total_verified_voters'] == 2
    assert stats['turnout_percentage'] == 50.0

    csv_resp = client.get(f'/api/admin/export-csv?election_id={e1_id}', headers=admin_headers)
    assert csv_resp.status_code == 200
    assert 'text/csv' in csv_resp.content_type
    csv_text = csv_resp.get_data(as_text=True)
    assert 'Candidate Name' in csv_text
    assert 'Candidate Sarah' in csv_text
