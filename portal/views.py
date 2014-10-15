from flask import render_template, jsonify, request, session
from portal import app
from portal.models.sf import SFPerson
from portal.authorize import login_required
from portal.utils import is_testing


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/error')
def error():
    return render_template('alerts.html')


@app.route('/home')
@login_required
def home():
    return render_template('home.html')


@app.route('/api/people')
@app.route('/api/people/page')
@app.route('/api/people/page/<int:page_no>')
@login_required
def api_people(page_no=1):
    sf = SFPerson()
    results = sf.get_all()

    return jsonify(response="Success", results=results)


@app.route('/api/people/find', methods=['POST'])
@login_required
def api_people_find():
    name = request.json.get('name')
    sf = SFPerson()
    results = sf.find(name)
    return jsonify(response="Success", results=results)


@app.route('/api/people/<contact_id>')
@login_required
def api_person_get(contact_id):
    sf = SFPerson()
    contact, small_groups, teams = sf.person_by_id(contact_id)
    contact['small_groups'] = small_groups
    contact['team_serving'] = teams

    return jsonify(response="Success", person=contact)


@app.route('/api/people/<contact_id>/team/<team_id>', methods=['POST'])
@login_required
def api_person_team(contact_id, team_id):
    sf = SFPerson()
    team = sf.person_team_serving_update(contact_id, team_id)
    return jsonify(response="Success", team=team)


@app.route('/api/people/<contact_id>/small_group/<group_id>', methods=['POST'])
@login_required
def api_person_small_group(contact_id, group_id):
    sf = SFPerson()
    small_group = sf.person_small_group_update(contact_id, group_id)
    return jsonify(response="Success", small_group=small_group)


@app.route('/api/permissions', methods=['POST'])
def api_permissions():
    """
    Get the permissions for the current user.
    """
    permissions = {
        "name": session["name"],
        "role": session["role"],
        "user_id": session["user_id"],
    }
    return jsonify(response="Success", permissions=permissions)
