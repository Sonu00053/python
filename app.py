from flask import Flask
from config.constant import APP_NAME,SECRET_KEY
from routes.user_routes import user_bp
from routes.site_routes import site_bp

app = Flask(__name__)
app.secret_key = SECRET_KEY

app.register_blueprint(user_bp)
app.register_blueprint(site_bp)
@app.context_processor
def inject_constants():
    return dict(
        APP_NAME=APP_NAME,
    )
if __name__ == "__main__":
    app.run(debug=True)
    
