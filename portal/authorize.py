from portal import app
from flask import redirect
from flask import request
from flask import url_for
from flask import session
from flask_oauthlib.client import OAuth
from functools import wraps
from portal.models.sf import SFPerson


# Prepare OAuth
oauth = OAuth(app)

google = oauth.remote_app(
    'google',
    consumer_key=app.config.get('GCLIENT_ID'),
    consumer_secret=app.config.get('GCLIENT_SECRET'),
    request_token_params={
        'scope': 'https://www.googleapis.com/auth/userinfo.email'
    },
    base_url='https://www.googleapis.com/oauth2/v1/',
    request_token_url=None,
    access_token_method='POST',
    access_token_url='https://accounts.google.com/o/oauth2/token',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
)


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get('google_token') is None:
            return redirect(url_for('login', next=request.url))
        session.pop('messages', None)

        # Update the user's last activity time
        if 'user_id' in session:
            person = SFPerson()
            person.update_last_login(session['user_id'])

        return f(*args, **kwargs)
    return decorated_function


@app.route('/login')
def login():
    return google.authorize(callback=url_for('authorized', _external=True))


@app.route('/login/authorized')
#@google.authorized_handler
def authorized():
    resp = None
    resp = google.authorized_response()
    if resp is None:
        return 'Access denied: reason=%s error=%s' % (
            request.args['error_reason'],
            request.args['error_description']
        )
    session['google_token'] = (resp['access_token'], '')
    me = google.get('userinfo')

    # The user's email address
    result = check_user(me.data.get('email'))

    if result:
        return redirect(url_for('home'))
    else:
        return redirect(url_for('error'))


@google.tokengetter
def get_google_oauth_token():
    return session.get('google_token')


def check_user(email):
    """
    Check we have a valid app user for the Google user.
    """
    session.pop('messages', None)

    person = SFPerson()
    user = person.user_by_email(email)
    if not user:
        # Reset the Google token and forbid access
        session.pop('google_token', None)
        session['messages'] = """Your Email address (%s) is not registered
            with this site. If you know you have an account here, please logout
            of your Google Account and login with the account that has been
            registered with this site.""" % email
        return False
    else:
        # Save the user details in the session
        session['user_id'] = user["Id"]
        session['role'] = user["Portal_Role__c"]
        session['name'] = user["Name"]
        session['manage_teams'] = len(user['Contact_PortalGroup_Links__r'] or [])
        return True
