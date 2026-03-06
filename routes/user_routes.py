from curses import flash

# import app
# import app
from flask import Blueprint, request, render_template, redirect, url_for, session,flash
from controllers.User.Userinfo import UserController
from controllers.User.Auth import LoginController
from helpers.auth_helper import login_required

user_bp = Blueprint(
    'user_bp',
    __name__,
    template_folder='../templates/User'
)



@user_bp.route('/register')
def register_page():
    return render_template("register.html",title = "Register")

@user_bp.route('/registerPost', methods=['POST'])
def register():
    data = request.form
    response = UserController.register_user(data)

    if response["status"]:
        flash(response["message"], "success")
        return redirect(response["redirect"])

    flash(response["message"], "danger")
    return redirect("/register")

@user_bp.route('/profile', methods=["GET", "POST"])
@login_required()

def profile_page():
    return UserController.profile()


# @user_bp.route('/login')
# def login_page():
#     return render_template("login.html",title = "Login")


# # 🔹 Login Process
# @user_bp.route("/loginPost", methods=["POST"])
# def login_post():
#     response = LoginController.login_user(request.form)
#     if response["status"]:
#         return redirect(url_for("user_bp.dashboard"))
#     # return render_template("login.html",title="Login", response=response)



@user_bp.route("/login", methods=["GET", "POST"])
def login():
    if "user_id" in session:
            return redirect(url_for("user_bp.dashboard"))
    # 🔹 Agar form submit hua (POST request)
    if request.method == "POST":
        response = LoginController.login_user(request.form)

        if response["status"]:
            return redirect(url_for("user_bp.dashboard"))
        else:
            return render_template(
                "login.html",
                title="Login",
                response=response
            )

    # 🔹 Normal page load (GET request)
    return render_template("login.html", title="Login")



# 🔹 Dashboard
@user_bp.route('/dashboard')
@login_required()
def dashboard():
    if "user_id" not in session:
        return redirect(url_for('user_bp.login'))
    return render_template("dashboard.html",title = "Dashboard")
# 🔹 Logout
@user_bp.route('/logout')
def logout():
    LoginController.logout_user()
    return redirect(url_for('user_bp.login'))

@user_bp.route('/users')
@login_required()
def get_users():
    return UserController.get_users()

@user_bp.route("/message", methods=["GET","POST"])
@login_required()
def message():
    return UserController.message()

@user_bp.route("/upload_status", methods=["POST"])
@login_required()
def upload_status():
    return UserController.upload_status()