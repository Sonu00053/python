import os
APP_NAME = "Python "
APP_VERSION = "1.0.0"
DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = ""
DB_NAME = "python"
PREFIX = "DEV"

# Secret Key
SECRET_KEY = os.environ.get("SECRET_KEY") or "VishUSONUKamalGourav"

ADMIN_ID = "DEVILACCESS"
ADMIN_PASSWORD = "DEVILACCESS"

# Pagination
PER_PAGE = 10