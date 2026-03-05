from flask import render_template

class SiteController:

    @staticmethod
    def home():
        return render_template("Site/index.html")