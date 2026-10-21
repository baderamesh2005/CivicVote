from flask import Blueprint, request, jsonify
from database import db
from models import Election, Candidate, Vote

election_bp = Blueprint('election', __name__)

@election_bp.route('/list', methods=['GET'])
def get_all_elections():
    elections = Election.query.order_by(Election.id.asc()).all()
    return jsonify({
        'success': True,
        'elections': [e.to_dict(include_candidates=True) for e in elections]
    }), 200

@election_bp.route('/active', methods=['GET'])
def get_active_election():
    election_id = request.args.get('id', type=int)
    if election_id:
        election = Election.query.get(election_id)
    else:
        election = Election.query.filter_by(is_active=True).first()

    if not election:
        return jsonify({'success': False, 'error': 'No active election currently configured'}), 404

    return jsonify({
        'success': True,
        'election': election.to_dict(include_candidates=True)
    }), 200

@election_bp.route('/<int:election_id>', methods=['GET'])
def get_election_by_id(election_id):
    election = Election.query.get(election_id)
    if not election:
        return jsonify({'success': False, 'error': 'Election not found'}), 404

    return jsonify({
        'success': True,
        'election': election.to_dict(include_candidates=True)
    }), 200

@election_bp.route('/results', methods=['GET'])
def get_public_results():
    election_id = request.args.get('election_id', type=int)
    if election_id:
        election = Election.query.get(election_id)
    else:
        election = Election.query.filter_by(is_active=True).first()

    if not election:
        return jsonify({'success': False, 'error': 'No election found'}), 404

    total_votes = Vote.query.filter_by(election_id=election.id).count()
    candidate_stats = []
    
    for candidate in election.candidates:
        c_votes = Vote.query.filter_by(election_id=election.id, candidate_id=candidate.id).count()
        pct = round((c_votes / total_votes * 100), 1) if total_votes > 0 else 0.0
        candidate_stats.append({
            'id': candidate.id,
            'name': candidate.name,
            'party': candidate.party,
            'initials': candidate.to_dict().get('initials', 'CA'),
            'photo_url': candidate.photo_url or '',
            'vote_count': c_votes,
            'percentage': pct
        })

    candidate_stats.sort(key=lambda x: x['vote_count'], reverse=True)

    all_elections = Election.query.all()

    return jsonify({
        'success': True,
        'election': election.to_dict(include_candidates=False),
        'total_votes': total_votes,
        'candidates': candidate_stats,
        'elections_list': [{'id': e.id, 'title': e.title, 'role_category': e.role_category, 'is_open': e.is_currently_open} for e in all_elections]
    }), 200
