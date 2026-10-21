import sys
import os
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from database import db
from models import Voter, Admin, Election, Candidate, Vote, OTPRequest
from security import hash_password

def seed_database():
    app = create_app()
    with app.app_context():
        db.create_all()

        print("--- Starting Database Seeding ---")
        now = datetime.now(timezone.utc)

        # 1. Seed Multiple Elections across different roles
        elections_init = [
            {
                "title": "Student Council President Election 2026",
                "role_category": "President",
                "description": "Executive head of the Student Union representing all undergraduate and graduate departments.",
                "candidates": [
                    {
                        "name": "Sarah Chen",
                        "party": "Tech & Innovation Slate",
                        "bio": "Third-year CS major advocating for 24/7 campus lab access, expanded cloud computing grants, and student innovation incubators."
                    },
                    {
                        "name": "Marcus Vance",
                        "party": "Student Welfare Alliance",
                        "bio": "Economics junior dedicated to affordable nutritious campus meal plans, expanded mental health counseling slots, and student housing rent stabilization."
                    },
                    {
                        "name": "Elena Rodriguez",
                        "party": "Academic Excellence Coalition",
                        "bio": "Pre-Law & Philosophy student campaigning for open-source digital textbook adoption, standardized grading rubrics, and expanded peer-mentorship."
                    }
                ]
            },
            {
                "title": "General Secretary Election 2026",
                "role_category": "Secretary",
                "description": "Responsible for student council communications, club charters, and transparent senate record-keeping.",
                "candidates": [
                    {
                        "name": "Priya Patel",
                        "party": "Campus Sustainability Initiative",
                        "bio": "Environmental Engineering candidate leading zero-waste dining campaigns, subsidized electric campus transport, and green senate budgets."
                    },
                    {
                        "name": "Jordan Taylor",
                        "party": "Arts & Athletics Union",
                        "bio": "Communications & Sports Management double major pushing for upgraded recreation facilities and increased funding for campus clubs."
                    }
                ]
            },
            {
                "title": "Treasurer & Financial Controller 2026",
                "role_category": "Treasurer",
                "description": "Managing student activity fee allocations, transparent audit reports, and student project funding grants.",
                "candidates": [
                    {
                        "name": "Liam Connor",
                        "party": "Fiscal Transparency Group",
                        "bio": "Finance major advocating for public line-item budget dashboards and fast-track student project micro-grants."
                    },
                    {
                        "name": "Aaliyah Khan",
                        "party": "Student Opportunity Slate",
                        "bio": "Data Science junior focused on emergency student relief funds and subsidized career certification vouchers."
                    }
                ]
            }
        ]

        for el_info in elections_init:
            existing_el = Election.query.filter_by(title=el_info["title"]).first()
            if not existing_el:
                el = Election(
                    title=el_info["title"],
                    role_category=el_info["role_category"],
                    description=el_info["description"],
                    start_time=now - timedelta(hours=1),
                    end_time=now + timedelta(days=7),
                    is_active=True
                )
                db.session.add(el)
                db.session.commit()
                print(f"Created election: {el.title} (Role: {el.role_category})")
                
                for c_data in el_info["candidates"]:
                    cand = Candidate(
                        election_id=el.id,
                        name=c_data["name"],
                        party=c_data["party"],
                        bio=c_data["bio"],
                        photo_url=""
                    )
                    db.session.add(cand)
                db.session.commit()
                print(f"  Added {len(el_info['candidates'])} candidates for {el.title}")
            else:
                existing_el.start_time = now - timedelta(hours=1)
                existing_el.end_time = now + timedelta(days=7)
                existing_el.is_active = True
                db.session.commit()
                print(f"Updated election: {existing_el.title}")

        # 2. Seed Pre-verified voters
        voters_data = [
            {
                "name": "Alex Mercer",
                "college_id": "STU-2026-001",
                "email": "alex.voter@college.edu",
                "phone": "+15551234567",
                "password": "VoterPass123!",
                "is_verified": True,
                "has_voted": False
            },
            {
                "name": "Maya Lin",
                "college_id": "STU-2026-002",
                "email": "maya.voter@college.edu",
                "phone": "+15559876543",
                "password": "VoterPass123!",
                "is_verified": True,
                "has_voted": False
            }
        ]

        for v_info in voters_data:
            existing_v = Voter.query.filter_by(email=v_info["email"]).first()
            if not existing_v:
                v = Voter(
                    name=v_info["name"],
                    college_id=v_info["college_id"],
                    email=v_info["email"],
                    phone=v_info["phone"],
                    password_hash=hash_password(v_info["password"]),
                    is_verified=v_info["is_verified"],
                    has_voted=v_info["has_voted"]
                )
                db.session.add(v)
                print(f"Created voter: {v_info['email']}")
            else:
                existing_v.is_verified = True
        db.session.commit()

        # 3. Seed Admin Account
        admin_email = "admin@election.org"
        existing_admin = Admin.query.filter_by(email=admin_email).first()
        if not existing_admin:
            adm = Admin(
                name="Election Commissioner",
                email=admin_email,
                password_hash=hash_password("AdminSecret2026!")
            )
            db.session.add(adm)
            db.session.commit()
            print(f"Created admin: {admin_email}")
        else:
            print(f"Admin {admin_email} ready.")

        print("=== SEED COMPLETE ===")

if __name__ == "__main__":
    seed_database()
