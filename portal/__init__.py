import os
from flask import Flask

app = Flask(__name__)

app.secret_key = os.environ["SECRET_KEY"]
app.logger.info('Portal Start-Up')

app.debug = True

from portal import utils
from portal import views
