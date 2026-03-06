from curses import flash

from flask import (
    Blueprint,
    request,
    render_template,
    redirect,
    url_for,
    session,
    jsonify,
    flash,
)
import json, os
import uuid
from datetime import datetime, timedelta
from config.constant import PREFIX
from models.dynamic_model import UserModel
from helpers.message_helper import success, error
from helpers.form_master import FormHelper
from werkzeug.utils import secure_filename


class UserController:
    UPLOAD_FOLDER = "static/uploads"
    STATUS_FOLDER = "static/status"
    ALLOWED_EXTENSIONS = {"webm"}
    STATUS_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "mp4", "mov", "avi", "webm"}

    @staticmethod
    def register_user(data):
        if not data.get("name") or not data.get("email") or not data.get("password"):
            return error("All required fields must be filled")
        checkMail = UserModel.get_single_record(
            "users", {"email": data.get("email")}, "email"
        )
        if checkMail:
            return error("Email Address Already Exists")
        adddata = {
            "user_id": UserController.GenerateUserId(),
            "name": data.get("name"),
            "email": data.get("email"),
            "password": data.get("password"),
            "phone": data.get("phone"),
        }
        result = UserModel.add("users", adddata)
        if result:
            return success("User Registered Successfully", redirect_url="/register")
        else:
            return error("Something went wrong")

    @staticmethod
    def get_users():
        page = request.args.get("page", 1, type=int)
        search = request.args.get("search", "").strip()
        per_page = 5
        offset = (page - 1) * per_page
        users, total = UserModel.paginated_records(
            "users", "*", search, per_page, offset, "ASC"
        )
        thead = ["ID", "Name", "Email", "Phone", "Created"]
        total_pages = (total + per_page - 1) // per_page
        tbody = []
        for index, user in enumerate(users, start=1 + (page - 1) * per_page):
            tbody.append(
                [
                    index,
                    user["name"],
                    user["email"],
                    user["phone"],
                    user["created_at"].strftime("%Y-%m-%d %H:%M:%S"),
                ]
            )
        response = {
            "users": users,
            "header": "All Users",
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "base_url": url_for("user_bp.get_users"),
            "thead": thead,
            "tbody": tbody,
        }
        return render_template("users.html", response=response)

    @staticmethod
    def profile():
        if "user_id" not in session:
            return redirect(url_for("user_bp.login_page"))
        user = UserModel.get_single_record(
            "users", {"user_id": session["user_id"]}, "*"
        )
        header = "Update Profile"
        form_action = url_for("user_bp.profile_page")
        form = {}
        form = {
            "form_open": FormHelper.form_open(form_action),
            "name": FormHelper.form_label("Name", "name")
            + FormHelper.form_input(
                {
                    "type": "text",
                    "name": "name",
                    "id": "name",
                    "class": "form-control",
                    "value": user.get("name", ""),
                    "placeholder": "Enter Name",
                }
            ),
            "email": FormHelper.form_label("Email", "email")
            + FormHelper.form_input(
                {
                    "type": "email",
                    "name": "email",
                    "id": "email",
                    "class": "form-control",
                    "value": user.get("email", ""),
                    "placeholder": "Enter Email",
                }
            ),
            "phone": FormHelper.form_label("Phone", "phone")
            + FormHelper.form_input(
                {
                    "type": "text",
                    "name": "phone",
                    "id": "phone",
                    "class": "form-control",
                    "value": user.get("phone", ""),
                    "placeholder": "Enter Phone",
                }
            ),
            "password": FormHelper.form_label("Password", "password")
            + FormHelper.form_input(
                {
                    "type": "text",
                    "name": "password",
                    "id": "password",
                    "class": "form-control",
                    "value": user.get("password", ""),
                    "placeholder": "Enter Password",
                }
            ),
            "submit": FormHelper.form_submit(
                "Update Profile", {"class": "btn btn-primary"}
            ),
            "form_close": FormHelper.form_close(),
        }
        if request.method == "POST":
            data = request.form
            update_data = {
                "name": data.get("name"),
                "email": data.get("email"),
                "phone": data.get("phone"),
                "password": data.get("password"),
            }
            UserModel.update_record(
                "users", {"user_id": session["user_id"]}, update_data
            )
            flash("Profile Updated Successfully", "success")
            return redirect(url_for("user_bp.profile_page"))

        return render_template("forms.html", header=header, form=form)

    @staticmethod
    def GenerateUserId():
        import random

        user_id = PREFIX + str(random.randint(10000, 99999))
        existing_user = UserModel.get_single_record(
            "users", {"user_id": user_id}, "user_id"
        )
        if existing_user:
            return UserController.GenerateUserId()
        else:
            return user_id

    @staticmethod
    def AutoCron():
        adddata = {
            "user_id": UserController.GenerateUserId(),
            "amount": "10",
            "type": "credit",
            "description": "Cron Job Credit",
        }
        UserModel.add("income_wallet", adddata)

    @staticmethod
    def allowed_file(filename):
        return (
            "." in filename
            and filename.rsplit(".", 1)[1].lower() in UserController.ALLOWED_EXTENSIONS
        )

    @staticmethod
    def message():
        sender_id = session["user_id"]
        receiver_id = "admin"

        # Handle POST (sending message)
        if request.method == "POST":
            msg = request.form.get("message")
            audio = request.files.get("audio")
            video = request.files.get("video")

            chat = UserModel.get_single_record("messages", {"user_id": sender_id}, "*")
            old_messages = []

            if chat:
                try:
                    old_messages = (
                        json.loads(chat["message"]) if chat["message"] else []
                    )
                except:
                    old_messages = []

            new_id = old_messages[-1]["id"] + 1 if old_messages else 1

            if video and UserController.allowed_file(video.filename):
                filename = secure_filename(
                    f"video_{sender_id}_{int(datetime.now().timestamp())}.webm"
                )
                os.makedirs(UserController.UPLOAD_FOLDER, exist_ok=True)
                video.save(os.path.join(UserController.UPLOAD_FOLDER, filename))
                new_message = {
                    "id": new_id,
                    "sender_id": sender_id,
                    "receiver_id": receiver_id,
                    "message": filename,
                    "type": "video",
                    "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }
            elif audio and UserController.allowed_file(audio.filename):
                filename = secure_filename(
                    f"voice_{sender_id}_{int(datetime.now().timestamp())}.webm"
                )
                os.makedirs(UserController.UPLOAD_FOLDER, exist_ok=True)
                audio.save(os.path.join(UserController.UPLOAD_FOLDER, filename))
                new_message = {
                    "id": new_id,
                    "sender_id": sender_id,
                    "receiver_id": receiver_id,
                    "message": filename,
                    "type": "audio",
                    "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }
            elif msg:
                new_message = {
                    "id": new_id,
                    "sender_id": sender_id,
                    "receiver_id": receiver_id,
                    "message": msg,
                    "type": "text",
                    "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                }
            else:
                return redirect(url_for("user_bp.message"))

            old_messages.append(new_message)

            if chat:
                UserModel.update_record(
                    "messages",
                    {"user_id": sender_id},
                    {"message": json.dumps(old_messages, indent=4)},
                )
            else:
                UserModel.add(
                    "messages",
                    {
                        "user_id": sender_id,
                        "sender_id": "Admin",
                        "message": json.dumps([new_message], indent=4),
                    },
                )

            return redirect(url_for("user_bp.message"))

        # Handle GET (show messages)
        chat = UserModel.get_single_record("messages", {"user_id": sender_id}, "*")
        status = UserModel.get_single_record("status", {"user_id": sender_id}, "*")
        messages = []
        if chat and chat["message"]:
            try:
                messages = json.loads(chat["message"])
            except:
                messages = []

        status_messages = []
        if status and status["message"]:
            try:
                status_messages = json.loads(status["message"])
            except:
                status_messages = []

        return render_template(
            "message.html", messages=messages, user=chat, status=status_messages
        )

    @staticmethod
    def status_allowed_file(filename):
        return (
            "." in filename
            and filename.rsplit(".", 1)[1].lower() in UserController.STATUS_EXTENSIONS
        )

    @staticmethod
    def upload_status():
        if request.method != "POST":
            return jsonify({"success": False, "error": "Invalid request method"})

        if "status" not in request.files:
            return jsonify({"success": False, "error": "No file uploaded"})

        file = request.files["status"]
        if file.filename == "":
            return jsonify({"success": False, "error": "No file selected"})

        if not UserController.status_allowed_file(file.filename):
            return jsonify({"success": False, "error": "File type not allowed"})

        # Save file
        os.makedirs(UserController.STATUS_FOLDER, exist_ok=True)
        ext = file.filename.rsplit(".", 1)[1].lower()
        timestamp = int(datetime.now().timestamp())
        filename = secure_filename(f"status_{session['user_id']}_{timestamp}.{ext}")
        file_path = os.path.join(UserController.STATUS_FOLDER, filename)
        file.save(file_path)

        # Fetch existing status for user
        user_status = UserModel.get_single_record(
            "status", {"user_id": session["user_id"]}, "*"
        )
        if user_status:
            try:
                messages = (
                    json.loads(user_status["message"]) if user_status["message"] else []
                )
            except:
                messages = []
            new_id = messages[-1]["id"] + 1 if messages else 1
        else:
            messages = []
            new_id = 1  # first status for user
        new_status = {
            "id": new_id,  # serial ID
            "type": "video" if ext in ["mp4", "mov", "avi", "webm"] else "image",
            "file": filename,
            "status": 0,  # optional, can add text later
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

        # Append new status
        messages.append(new_status)

        # Save to DB
        if user_status:
            UserModel.update_record(
                "status",
                {"user_id": session["user_id"]},
                {
                    "message": json.dumps(messages, indent=4),
                    "updated_at": datetime.now(),
                },
            )
        else:
            UserModel.add(
                "status",
                {
                    "user_id": session["user_id"],
                    "message": json.dumps(messages, indent=4),
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                },
            )

        return jsonify({"success": True, "file_path": f"/{file_path}"})

    @staticmethod
    def UpdateStatus():
        records = UserModel.all_records("status", "", "*")
        for record in records:
            messages = json.loads(record["message"])
            print(f"Checking status for user_id: {record['user_id']} with {len(messages)} messages")
            updated = False
            for msg in messages:
                created_time = datetime.strptime(msg["created_at"], "%Y-%m-%d %H:%M:%S")
                if datetime.now() - created_time >= timedelta(hours=24):
                    if msg["status"] == 0:
                        msg["status"] = 1
                        updated = True
            if updated:
                UserModel.update_record(
                    "status", {"id": record["id"]}, {"message": json.dumps(messages)}
                )
