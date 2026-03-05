from flask import Blueprint
from controllers.Site import SiteController

site_bp = Blueprint(
    'site_bp',
    __name__
)

@site_bp.route('/')
def home():
    return SiteController.home()