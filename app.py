from flask import Flask
from flask_socketio import SocketIO, emit
import threading
import time

from config.constant import APP_NAME, SECRET_KEY
from routes.user_routes import user_bp
from routes.site_routes import site_bp
from controllers.User.Userinfo import UserController

app = Flask(__name__)
app.secret_key = SECRET_KEY

socketio = SocketIO(app, cors_allowed_origins="*")

# ---------------- AUTO CRON ---------------- #

def auto_cron_loop():
    while True:
        with app.app_context():
            print("AutoCron running...")
            UserController.UpdateStatus()
            socketio.emit("cron_update", {"msg": "Cron executed"})
        time.sleep(1)

threading.Thread(target=auto_cron_loop, daemon=True).start()

# ---------------- CALL EVENTS ---------------- #

@socketio.on("call_user")
def call_user(data):
    emit("incoming_call", data, broadcast=True)

@socketio.on("answer_call")
def answer_call(data):
    emit("call_answered", data, broadcast=True)

@socketio.on("webrtc_offer")
def webrtc_offer(data):
    emit("webrtc_offer", data, broadcast=True)

@socketio.on("webrtc_answer")
def webrtc_answer(data):
    emit("webrtc_answer", data, broadcast=True)

@socketio.on("webrtc_ice")
def webrtc_ice(data):
    emit("webrtc_ice", data, broadcast=True)

@socketio.on("start_audio_call")
def audio_call():
    emit("incoming_audio_call", broadcast=True, include_self=False)

@socketio.on("start_video_call")
def video_call():
    emit("incoming_video_call", broadcast=True, include_self=False)
# ---------------- BLUEPRINTS ---------------- #

app.register_blueprint(user_bp)
app.register_blueprint(site_bp)

@app.context_processor
def inject_constants():
    return dict(APP_NAME=APP_NAME)

if __name__ == "__main__":
    socketio.run(app, debug=True, port=5001)