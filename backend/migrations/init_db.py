import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from database import db

def init_database():
    app = create_app()
    with app.app_context():
        print('Creating database tables...')
        db.create_all()
        print('Database schema successfully initialized.')

if __name__ == '__main__':
    init_database()
