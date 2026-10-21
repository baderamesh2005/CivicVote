# CivicVote ? Secure Online Voting System

A production-ready, secure, and responsive **Online Voting Application** designed for university and organizational elections. Built with a Python Flask REST API backend and a modern React.js frontend with Tailwind CSS.

---

## Key Features & Security Architecture

1. **One-Vote Database Integrity & Atomic Enforcement**: Double-voting is mathematically and transactionally blocked using database unique constraints on encrypted voter references and atomic transaction rollbacks.
2. **Cryptographic Anonymous Ballots (AES)**: Voter identities are cryptographically decoupled from candidate vote records at rest, guaranteeing voter secrecy.
3. **Receipt Verification**: Voters receive a unique reference ID (VOTE-XXXX-XXXX-XXXX) upon submission for auditability without compromising confidentiality.
4. **Transparent Dev Mode OTP**: Automatic OTP generation and in-app display banner if external email/SMS providers are unconfigured, enabling effortless local testing.
5. **Time Window Enforcement**: Voting outside of the scheduled start and end timestamps is blocked server-side.
6. **Administrator Control Console**: Live turnout statistics, candidate CRUD operations with instant ballot synchronization, election schedule configuration, and audit-ready CSV results export.
7. **Security Hardened**: bcrypt password hashing, HS256 JWT sessions, rate limiting, server-side input validation, and zero sensitive data leakage in any API endpoint.

---

## Tech Stack

- **Frontend**: React 18 (Functional Components, Hooks), Tailwind CSS, Lucide Icons, Vite
- **Backend**: Python 3 (Flask, Flask-CORS, Flask-SQLAlchemy, Flask-Limiter, PyJWT, bcrypt, Cryptography)
- **Database**: SQLite (local zero-config out-of-the-box) or PostgreSQL / Supabase (via DATABASE_URL)

---

## Quick Start Setup Guide

### 1. Backend Setup

`ash
# Navigate to the backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Initialize database schema
python migrations/init_db.py

# Populate sample election, 5 candidates, test voters, and admin
python seeds/seed_data.py

# Start the Flask API server (runs on http://127.0.0.1:5000)
python app.py
`

### 2. Frontend Setup

`ash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server (runs on http://localhost:5173)
npm run dev
`

---

## Seeded Demo Credentials

| Role | Name / Identifier | Email | Password | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Voter 1** | Alex Mercer (STU-2026-001) | lex.voter@college.edu | VoterPass123! | Pre-verified, Ready to vote |
| **Voter 2** | Maya Lin (STU-2026-002) | maya.voter@college.edu | VoterPass123! | Pre-verified, Ready to vote |
| **Admin** | Election Commissioner | dmin@election.org | AdminSecret2026! | Full Admin Privileges |

> **Active Election**: "Class Representative Election 2026" (Active, 7 days remaining, 5 certified candidates).

---

## What I Tested (End-to-End Verification)

1. **Voter Registration & Dev Mode OTP**:
   - Registered new voter with legal name, college ID, email, and password.
   - Verified that OTP is generated, rendered in the in-app Dev Mode banner, and verified successfully with JWT issuance.
   - Tested duplicate voter email/college ID prevention (HTTP 409).
2. **Voter Authentication & Session Handling**:
   - Tested voter login with pre-verified credentials (lex.voter@college.edu).
   - Verified JWT issuance and automatic expiration/logout handling.
3. **Voting Flow & Confirmation**:
   - Rendered active candidates with photos, party affiliations, and bios.
   - Single-candidate selection with two-step confirmation modal.
   - Post-vote cryptographic receipt screen with unique tracking ID (VOTE-XXXX-XXXX-XXXX).
4. **Provable One-Vote Enforcement**:
   - Attempted to cast a second vote from the same voter account.
   - Verified that double-voting is rejected at both the model validation level and database unique constraint level (HTTP 409 Conflict).
5. **Election Window Enforcement**:
   - Attempted to vote when the election is scheduled in the past.
   - Verified server-side HTTP 400 rejection (ELECTION_CLOSED).
6. **Administrator Console**:
   - Logged in via dedicated admin portal (dmin@election.org).
   - Verified live turnout metrics (Total Registered, Verified, Votes Cast, Turnout %).
   - Verified candidate addition, modification, and deletion with instant voter-side reflection.
   - Generated and downloaded real CSV audit report with candidate vote shares.
7. **Automated Test Suite**:
   - Ran pytest backend/tests/ -v passing all 5 test suites covering registration, OTP verification, login, single-vote integrity, time-window blocks, and CSV export.

---

## Running Automated Tests

`ash
pytest backend/tests/ -v
`
