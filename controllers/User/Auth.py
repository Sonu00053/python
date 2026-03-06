from flask import session, redirect, url_for
from helpers.message_helper import success, error
from models.dynamic_model import UserModel


class LoginController:
    @staticmethod
    def login_user(data):
       
        email = data.get("email")
        password = data.get("password")

        if not email:
            return error("Email is required")

        if not password:
            return error("Password is required")

        user = UserModel.get_single_record(
            "users", {"email": email, "password": password}, "*"
        )
        if not user:
            return error("Invalid Credentials")

        session["user_id"] = user["user_id"]
        session["user_name"] = user["name"]

        return success("Login Successful", user)

    @staticmethod
    def logout_user():
        session.clear()
