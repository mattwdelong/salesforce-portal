import os
from flask import Flask

app = Flask(__name__)

app.secret_key = os.environ["SECRET_KEY"]
app.config['GCLIENT_ID'] = os.environ['GCLIENT_ID']
app.config['GCLIENT_SECRET'] = os.environ['GCLIENT_SECRET']
app.logger.info('Portal Start-Up')

app.debug = True

from portal import utils
from portal import views
