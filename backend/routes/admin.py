import io
import csv
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, Response
from database import db
from models import Election, Candidate, Vote, Voter, Admin
from security import admin_required, sanitize_string

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/elections', methods=['GET'])
@admin_required
def list_elections():
    elections = Election.query.order_by(Election.id.desc()).all()
    return jsonify({
        'success': True,
        'elections': [e.to_dict(include_candidates=True) for e in elections]
    }), 200

@admin_bp.route('/elections', methods=['POST'])
@admin_required
def create_election():
    data = request.get_json() or {}
    title = sanitize_string(data.get('title', ''), 150)
    description = sanitize_string(data.get('description', ''), 1000)
    role_category = sanitize_string(data.get('role_category', 'General'), 100)
    start_time_str = data.get('start_time')
    end_time_str = data.get('end_time')
    is_active = bool(data.get('is_active', True))

    if not title:
        return jsonify({'success': False, 'error': 'Election / Role Title is required'}), 400

    try:
        now = datetime.now(timezone.utc)
        if start_time_str:
            st = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
        else:
            st = now
        if end_time_str:
            et = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
        else:
            et = now.replace(year=now.year + 1)
    except Exception:
        return jsonify({'success': False, 'error': 'Invalid start or end date format'}), 400

    election = Election(
        title=title,
        description=description,
        role_category=role_category or 'General',
        start_time=st,
        end_time=et,
        is_active=is_active
    )
    db.session.add(election)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Election "{election.title}" created successfully',
        'election': election.to_dict(include_candidates=True)
    }), 201

@admin_bp.route('/elections/<int:election_id>', methods=['PUT'])
@admin_required
def update_election(election_id):
    election = Election.query.get(election_id)
    if not election:
        return jsonify({'success': False, 'error': 'Election not found'}), 404

    data = request.get_json() or {}
    if 'title' in data:
        election.title = sanitize_string(data['title'], 150)
    if 'description' in data:
        election.description = sanitize_string(data['description'], 1000)
    if 'role_category' in data:
        election.role_category = sanitize_string(data['role_category'], 100)
    if 'is_active' in data:
        election.is_active = bool(data['is_active'])
    if 'start_time' in data:
        try:
            st = data['start_time'].replace('Z', '+00:00')
            election.start_time = datetime.fromisoformat(st)
        except Exception:
            return jsonify({'success': False, 'error': 'Invalid start_time ISO format'}), 400
    if 'end_time' in data:
        try:
            et = data['end_time'].replace('Z', '+00:00')
            election.end_time = datetime.fromisoformat(et)
        except Exception:
            return jsonify({'success': False, 'error': 'Invalid end_time ISO format'}), 400

    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Election parameters updated successfully',
        'election': election.to_dict(include_candidates=True)
    }), 200

@admin_bp.route('/elections/<int:election_id>', methods=['DELETE'])
@admin_required
def delete_election(election_id):
    election = Election.query.get(election_id)
    if not election:
        return jsonify({'success': False, 'error': 'Election not found'}), 404

    db.session.delete(election)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': f'Election "{election.title}" and associated candidates/votes deleted successfully'
    }), 200

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def admin_dashboard():
    election_id = request.args.get('election_id', type=int)
    all_elections = Election.query.order_by(Election.id.asc()).all()

    if election_id:
        selected_election = Election.query.get(election_id)
    else:
        selected_election = all_elections[0] if all_elections else None

    total_registered = Voter.query.count()
    total_verified = Voter.query.filter_by(is_verified=True).count()
    
    total_votes = Vote.query.filter_by(election_id=selected_election.id).count() if selected_election else 0
    turnout_pct = round((total_votes / total_verified * 100), 2) if total_verified > 0 else 0.0

    candidates_data = []
    if selected_election:
        for c in selected_election.candidates:
            v_count = Vote.query.filter_by(election_id=selected_election.id, candidate_id=c.id).count()
            pct = round((v_count / total_votes * 100), 1) if total_votes > 0 else 0.0
            candidates_data.append({
                'id': c.id,
                'name': c.name,
                'party': c.party,
                'bio': c.bio,
                'initials': c.to_dict().get('initials', 'CA'),
                'photo_url': c.photo_url or '',
                'vote_count': v_count,
                'percentage': pct
            })
        candidates_data.sort(key=lambda x: x['vote_count'], reverse=True)

    return jsonify({
        'success': True,
        'stats': {
            'total_registered_voters': total_registered,
            'total_verified_voters': total_verified,
            'total_votes_cast': total_votes,
            'turnout_percentage': turnout_pct
        },
        'election': selected_election.to_dict(include_candidates=False) if selected_election else None,
        'elections_list': [e.to_dict(include_candidates=False) for e in all_elections],
        'candidates': candidates_data
    }), 200

@admin_bp.route('/candidates', methods=['POST'])
@admin_required
def add_candidate():
    data = request.get_json() or {}
    name = sanitize_string(data.get('name', ''), 100)
    party = sanitize_string(data.get('party', ''), 100)
    bio = sanitize_string(data.get('bio', ''), 1000)
    photo_url = sanitize_string(data.get('photo_url', ''), 300)
    election_id = data.get('election_id')

    if not name or not party:
        return jsonify({'success': False, 'error': 'Candidate Name and Party/Affiliation are required'}), 400

    if not election_id:
        return jsonify({'success': False, 'error': 'Election selection is required'}), 400

    election = Election.query.get(election_id)
    if not election:
        return jsonify({'success': False, 'error': 'Target election does not exist'}), 400

    candidate = Candidate(
        election_id=election.id,
        name=name,
        party=party,
        bio=bio,
        photo_url=photo_url or ''
    )
    db.session.add(candidate)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Candidate "{candidate.name}" added to {election.title}',
        'candidate': candidate.to_dict()
    }), 201

@admin_bp.route('/candidates/<int:candidate_id>', methods=['PUT'])
@admin_required
def update_candidate(candidate_id):
    candidate = Candidate.query.get(candidate_id)
    if not candidate:
        return jsonify({'success': False, 'error': 'Candidate not found'}), 404

    data = request.get_json() or {}
    if 'name' in data:
        candidate.name = sanitize_string(data['name'], 100)
    if 'party' in data:
        candidate.party = sanitize_string(data['party'], 100)
    if 'bio' in data:
        candidate.bio = sanitize_string(data['bio'], 1000)
    if 'photo_url' in data:
        candidate.photo_url = sanitize_string(data['photo_url'], 300)

    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Candidate updated successfully',
        'candidate': candidate.to_dict()
    }), 200

@admin_bp.route('/candidates/<int:candidate_id>', methods=['DELETE'])
@admin_required
def delete_candidate(candidate_id):
    candidate = Candidate.query.get(candidate_id)
    if not candidate:
        return jsonify({'success': False, 'error': 'Candidate not found'}), 404

    db.session.delete(candidate)
    db.session.commit()
    return jsonify({
        'success': True,
        'message': 'Candidate removed from election'
    }), 200

@admin_bp.route('/export-csv', methods=['GET'])
@admin_required
def export_results_csv():
    election_id = request.args.get('election_id', type=int)
    if election_id:
        election = Election.query.get(election_id)
    else:
        election = Election.query.filter_by(is_active=True).first()

    if not election:
        return jsonify({'success': False, 'error': 'No election found'}), 404

    total_votes = Vote.query.filter_by(election_id=election.id).count()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(['Election Report', election.title])
    writer.writerow(['Role / Category', election.role_category or 'General'])
    writer.writerow(['Generated At', datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')])
    writer.writerow(['Total Ballots Cast', total_votes])
    writer.writerow([])
    
    writer.writerow(['Candidate ID', 'Candidate Name', 'Party / Slate', 'Vote Count', 'Vote Percentage'])
    for c in election.candidates:
        c_votes = Vote.query.filter_by(election_id=election.id, candidate_id=c.id).count()
        pct = round((c_votes / total_votes * 100), 2) if total_votes > 0 else 0.0
        writer.writerow([c.id, c.name, c.party, c_votes, f'{pct}%'])
    
    output.seek(0)
    filename = f'{election.title.replace(" ", "_")}_Results_{datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")}.csv'
    
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename={filename}'}
    )
