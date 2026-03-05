from functools import wraps
from flask import session, redirect, url_for

def login_required(route_name="user_bp.login"):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if "user_id" not in session:
                return redirect(url_for(route_name))
            return func(*args, **kwargs)
        return wrapper
    return decorator