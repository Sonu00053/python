from curses import flash

from flask import Blueprint, request, render_template, redirect, url_for, session,jsonify,flash
from config.constant import PREFIX
from models.dynamic_model import UserModel
from helpers.message_helper import success, error
from helpers.form_master import FormHelper

class UserController:
    @staticmethod
    def register_user(data):
        if not data.get("name") or not data.get("email") or not data.get("password"):
            return error("All required fields must be filled")

        adddata = {
            "user_id": UserController.GenerateUserId(),
            "name": data.get("name"),
            "email": data.get("email"),
            "password": data.get("password"),
            "phone": data.get("phone"),
        }
        result = UserModel.add('users', adddata)
        if result:
            return success("User Registered Successfully",redirect_url="/register")
        else:
            return error("Something went wrong")

    
    @staticmethod
    def get_users():
        page = request.args.get('page', 1, type=int)
        search = request.args.get('search', '').strip()
        per_page = 5
        offset = (page - 1) * per_page
        users, total = UserModel.paginated_records('users', '*', search, per_page, offset,'ASC')
        thead = ["ID", "Name", "Email", "Phone", "Created"]
        total_pages = (total + per_page - 1) // per_page
        tbody = []
        for index, user in enumerate(users, start=1 + (page - 1) * per_page):
            tbody.append([
                index,
                user["name"],
                user["email"],
                user["phone"],
                user["created_at"].strftime("%Y-%m-%d %H:%M:%S")
            ])
        response = {
            "users": users,
            "header": "All Users",
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "base_url": url_for('user_bp.get_users'),
            "thead": thead,
            "tbody": tbody
        }
        return render_template("users.html", response=response)
    
    

    @staticmethod
    def profile():
        if "user_id" not in session:
            return redirect(url_for("user_bp.login_page"))
        user = UserModel.get_single_record("users", {"id": session["user_id"]}, "*")
        header = "Update Profile"
        form_action = url_for("user_bp.profile_page")
        form = {}
        form = {
            "form_open": FormHelper.form_open(form_action),
            "name": FormHelper.form_label("Name", "name") + FormHelper.form_input({"type":"text","name":"name","id":"name","class":"form-control","value":user.get("name",""),"placeholder":"Enter Name"}),
            "email": FormHelper.form_label("Email", "email") + FormHelper.form_input({"type":"email","name":"email","id":"email","class":"form-control","value":user.get("email",""),"placeholder":"Enter Email"}),
            "phone": FormHelper.form_label("Phone", "phone") + FormHelper.form_input({"type":"text","name":"phone","id":"phone","class":"form-control","value":user.get("phone",""),"placeholder":"Enter Phone"}),
            "password": FormHelper.form_label("Password", "password") + FormHelper.form_input({"type":"text","name":"password","id":"password","class":"form-control","value":user.get("password",""),"placeholder":"Enter Password"}),
            "submit": FormHelper.form_submit("Update Profile", {"class":"btn btn-primary"}),
            "form_close": FormHelper.form_close()
        }
        if request.method == "POST":
            data = request.form
            update_data = {
                "name": data.get("name"),
                "email": data.get("email"),
                "phone": data.get("phone"),
                "password": data.get("password")
            }
            UserModel.update_record("users", {"id": session["user_id"]}, update_data)
            flash("Profile Updated Successfully", "success")
            return redirect(url_for("user_bp.profile_page"))
        else:
            flash("No changes to update", "danger")
        return render_template("forms.html", header=header, form=form)
    
    
    @staticmethod
    def GenerateUserId():
        import random
        user_id = PREFIX + str(random.randint(10000, 99999))
        existing_user = UserModel.get_single_record('users',{'user_id': user_id},'user_id')
        if existing_user:
            return UserController.GenerateUserId()
        else:
            return user_id
    
    
    
    
