from datetime import datetime, timezone
from database import db

def parse_utc(dt):
    if dt is None:
        return None
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except Exception:
            return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def utc_now():
    return datetime.now(timezone.utc)

class Voter(db.Model):
    __tablename__ = 'voters'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    college_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(25), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    has_voted = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utc_now)
    
    otp_requests = db.relationship('OTPRequest', backref='voter', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'college_id': self.college_id,
            'email': self.email,
            'phone': self.phone,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'role': 'voter'
        }

class Admin(db.Model):
    __tablename__ = 'admins'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utc_now)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'role': 'admin'
        }

class Election(db.Model):
    __tablename__ = 'elections'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    role_category = db.Column(db.String(100), nullable=True, default='General')
    start_time = db.Column(db.DateTime(timezone=True), nullable=False)
    end_time = db.Column(db.DateTime(timezone=True), nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utc_now)
    
    candidates = db.relationship('Candidate', backref='election', cascade='all, delete-orphan', lazy=True)
    votes = db.relationship('Vote', backref='election', cascade='all, delete-orphan', lazy=True)

    @property
    def is_currently_open(self):
        if not self.is_active:
            return False
        now = utc_now()
        st = parse_utc(self.start_time)
        et = parse_utc(self.end_time)
        if not st or not et:
            return False
        return (st <= now <= et)

    @property
    def seconds_remaining(self):
        now = utc_now()
        et = parse_utc(self.end_time)
        if not et:
            return 0
        diff = (et - now).total_seconds()
        return max(0, int(diff))

    def to_dict(self, include_candidates=True):
        st = parse_utc(self.start_time)
        et = parse_utc(self.end_time)
        ct = parse_utc(self.created_at)
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'role_category': self.role_category or 'General',
            'start_time': st.isoformat() if st else None,
            'end_time': et.isoformat() if et else None,
            'is_active': self.is_active,
            'is_open': self.is_currently_open,
            'seconds_remaining': self.seconds_remaining,
            'candidate_count': len(self.candidates),
            'vote_count': len(self.votes),
            'created_at': ct.isoformat() if ct else None
        }
        if include_candidates:
            data['candidates'] = [c.to_dict() for c in self.candidates]
        return data

class Candidate(db.Model):
    __tablename__ = 'candidates'
    
    id = db.Column(db.Integer, primary_key=True)
    election_id = db.Column(db.Integer, db.ForeignKey('elections.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    party = db.Column(db.String(100), nullable=False)
    bio = db.Column(db.Text, nullable=True)
    photo_url = db.Column(db.String(300), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utc_now)
    
    votes = db.relationship('Vote', backref='candidate', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        ct = parse_utc(self.created_at)
        # Compute initials
        name_parts = self.name.strip().split()
        initials = (name_parts[0][0] + (name_parts[-1][0] if len(name_parts) > 1 else '')).upper() if name_parts else 'CA'
        return {
            'id': self.id,
            'election_id': self.election_id,
            'name': self.name,
            'party': self.party,
            'bio': self.bio,
            'initials': initials,
            'photo_url': self.photo_url or '',
            'created_at': ct.isoformat() if ct else None
        }

class Vote(db.Model):
    __tablename__ = 'votes'
    
    id = db.Column(db.Integer, primary_key=True)
    election_id = db.Column(db.Integer, db.ForeignKey('elections.id', ondelete='CASCADE'), nullable=False, index=True)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id', ondelete='CASCADE'), nullable=False, index=True)
    encrypted_voter_ref = db.Column(db.String(255), nullable=False)
    receipt_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    cast_at = db.Column(db.DateTime(timezone=True), default=utc_now)

    __table_args__ = (
        db.UniqueConstraint('election_id', 'encrypted_voter_ref', name='uq_election_voter_vote'),
    )

    def to_dict(self):
        ct = parse_utc(self.cast_at)
        return {
            'id': self.id,
            'election_id': self.election_id,
            'candidate_id': self.candidate_id,
            'receipt_id': self.receipt_id,
            'cast_at': ct.isoformat() if ct else None
        }

class OTPRequest(db.Model):
    __tablename__ = 'otp_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    voter_id = db.Column(db.Integer, db.ForeignKey('voters.id', ondelete='CASCADE'), nullable=False, index=True)
    otp_code_hash = db.Column(db.String(255), nullable=False)
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    verified = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utc_now)
