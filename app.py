from flask import Flask
from flask_socketio import SocketIO
import threading
import time
import app
from config.constant import APP_NAME, SECRET_KEY
from routes.user_routes import user_bp
from routes.site_routes import site_bp
from controllers.User.Userinfo import UserController
app = Flask(__name__)
app.secret_key = SECRET_KEY

socketio = SocketIO(app)

def auto_cron_loop():
    while True:
        with app.app_context():
            print("AutoCron running every second...")
            UserController.UpdateStatus()
            UserController.message()
            user_bp.dashboard()
            socketio.emit("cron_update", {"msg": "Cron executed"})
        time.sleep(1)   # 1 second

# background thread start hsdasda
threading.Thread(target=auto_cron_loop, daemon=True).start()

# Blueprints
app.register_blueprint(user_bp)
app.register_blueprint(site_bp)

@app.context_processor
def inject_constants():
    return dict(APP_NAME=APP_NAME)

if __name__ == "__main__":
    socketio.run(app, debug=True, port=5001)