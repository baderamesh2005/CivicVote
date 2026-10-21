import os

# Render and cloud container port binding
port = os.getenv("PORT", "10000")
bind = f"0.0.0.0:{port}"
workers = 2
threads = 2
timeout = 120
