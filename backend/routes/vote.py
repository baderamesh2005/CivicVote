from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from database import db
from models import Election, Candidate, Vote, Voter
from security import voter_required, generate_receipt_id, generate_encrypted_voter_ref

vote_bp = Blueprint('vote', __name__)

@vote_bp.route('/status', methods=['GET'])
@voter_required
def get_vote_status():
    voter = request.current_voter
    election_id = request.args.get('election_id', type=int)

    if election_id:
        election = Election.query.get(election_id)
        if not election:
            return jsonify({'success': False, 'error': 'Election not found'}), 404
        
        voter_ref = generate_encrypted_voter_ref(voter.id, election.id)
        has_voted_this = Vote.query.filter_by(election_id=election.id, encrypted_voter_ref=voter_ref).first() is not None
        
        return jsonify({
            'success': True,
            'election_id': election.id,
            'has_voted': has_voted_this,
            'is_verified': voter.is_verified,
            'election_open': election.is_currently_open,
            'election_title': election.title
        }), 200

    # If no election_id specified, return voting status across all active elections
    active_elections = Election.query.filter_by(is_active=True).all()
    voted_elections_map = {}
    for el in active_elections:
        ref = generate_encrypted_voter_ref(voter.id, el.id)
        voted = Vote.query.filter_by(election_id=el.id, encrypted_voter_ref=ref).first() is not None
        voted_elections_map[el.id] = voted

    return jsonify({
        'success': True,
        'is_verified': voter.is_verified,
        'voted_map': voted_elections_map
    }), 200

@vote_bp.route('/cast', methods=['POST'])
@voter_required
def cast_vote():
    voter = request.current_voter
    data = request.get_json() or {}
    candidate_id = data.get('candidate_id')
    election_id = data.get('election_id')

    if not candidate_id:
        return jsonify({'success': False, 'error': 'Candidate selection is required'}), 400

    candidate = Candidate.query.get(candidate_id)
    if not candidate:
        return jsonify({'success': False, 'error': 'Selected candidate not found'}), 404

    # Determine election from candidate or input
    election = candidate.election
    if election_id and election.id != int(election_id):
        return jsonify({'success': False, 'error': 'Candidate does not match the requested election'}), 400

    if not election.is_currently_open:
        return jsonify({
            'success': False, 
            'error': 'Election is currently closed. Voting is only permitted during the scheduled election window.',
            'code': 'ELECTION_CLOSED'
        }), 400

    # Check if voter has already voted in THIS election
    encrypted_voter_ref = generate_encrypted_voter_ref(voter.id, election.id)
    existing_vote = Vote.query.filter_by(election_id=election.id, encrypted_voter_ref=encrypted_voter_ref).first()
    if existing_vote:
        return jsonify({
            'success': False, 
            'error': f'You have already cast your vote in "{election.title}". Multiple voting for the same position is strictly prohibited.',
            'code': 'ALREADY_VOTED'
        }), 409

    receipt_id = generate_receipt_id()

    try:
        new_vote = Vote(
            election_id=election.id,
            candidate_id=candidate.id,
            encrypted_voter_ref=encrypted_voter_ref,
            receipt_id=receipt_id,
            cast_at=datetime.now(timezone.utc)
        )
        db.session.add(new_vote)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'Your vote for {election.title} has been cast securely and anonymously.',
            'receipt_id': receipt_id,
            'election_id': election.id,
            'cast_at': new_vote.cast_at.isoformat(),
            'election_title': election.title
        }), 201

    except Exception as e:
        db.session.rollback()
        if 'uq_election_voter_vote' in str(e) or 'UNIQUE' in str(e).upper():
            return jsonify({
                'success': False,
                'error': f'A vote has already been registered from this account for {election.title}.',
                'code': 'ALREADY_VOTED'
            }), 409
        return jsonify({'success': False, 'error': 'Failed to cast vote due to an internal database error.'}), 500
