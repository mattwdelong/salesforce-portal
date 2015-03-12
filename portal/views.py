from flask import render_template, jsonify, request, session
from portal import app
from portal.models.sf import SFPerson, SFContact, SFEvent
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
    contact, small_groups, teams, team_permissions, core_teams = \
        sf.person_by_id(contact_id)
    contact['small_groups'] = small_groups
    contact['team_serving'] = teams
    contact['core_teams'] = core_teams
    contact['team_permissions'] = team_permissions

    return jsonify(response="Success", person=contact)


@app.route('/api/people/<contact_id>/team/<team_id>', methods=['POST'])
@login_required
def api_person_team(contact_id, team_id):
    sf = SFPerson()
    team = sf.person_team_serving_update(contact_id, team_id)
    return jsonify(response="Success", team=team)

@app.route('/api/people/<contact_id>/core_team/<team_id>', methods=['POST'])
@login_required
def api_person_core_team(contact_id, team_id):
    sf = SFPerson()
    team = sf.person_core_team_serving_update(contact_id, team_id)
    return jsonify(response="Success", team=team)

@app.route('/api/people/<contact_id>/team_permissions/<team_id>', methods=['POST'])
@login_required
def api_person_team_permissions(contact_id, team_id):
    sf = SFPerson()
    team = sf.person_team_permissions_update(contact_id, team_id)
    return jsonify(response="Success", team=team)


@app.route('/api/people/<contact_id>/small_group/<group_id>', methods=['POST'])
@login_required
def api_person_small_group(contact_id, group_id):
    sf = SFPerson()
    small_group = sf.person_small_group_update(contact_id, group_id)
    return jsonify(response="Success", small_group=small_group)


@app.route('/api/people/<contact_id>/toggle', methods=['POST'])
@login_required
def api_person_toggle_field(contact_id):
    sf = SFPerson()
    person = sf.toggle_field(contact_id, request.json["field"])
    return jsonify(response="Success")

@app.route('/api/permissions', methods=['POST'])
@login_required
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


@app.route('/api/contact/teams', methods=['POST'])
@login_required
def api_teams():
    """
    Get the teams, with the permissions of the ones that can be contacted.
    """
    sf = SFContact()
    team_response = {
        "teams": sf.teams(),
    }

    return jsonify(response="Success", data=team_response)


@app.route('/api/contact', methods=['POST'])
@login_required
def api_contact():
    """
    Get the teams and small groups.
    """
    sf = SFContact()
    response = {
        "teams": sf.teams(),
        "small_groups": sf.small_groups(),
    }

    return jsonify(response="Success", data=response)


@app.route('/api/contact/teams/selected', methods=['POST'])
@login_required
def api_team_members():
    """
    Get the people in a team.
    """
    members = []

    team_ids = request.json["selected_teams"]
    group_ids = request.json["selected_small_groups"]

    sf = SFContact()
    for t in team_ids:
        team_members = sf.team_members(t)
        for member in team_members:
            if member not in members:
                members.append(member)

    for t in team_ids:
        team_members = sf.core_team_members(t)
        for member in team_members:
            if member not in members:
                members.append(member)

    for t in group_ids:
        group_members = sf.small_group_members(t)
        for member in group_members:
            if member not in members:
                members.append(member)

    return jsonify(response="Success", members=members)


@app.route('/api/event', methods=['POST'])
@login_required
def api_event():
    """
    Get the events.
    """
    sf = SFEvent()
    response = sf.events()

    return jsonify(response="Success", data=response)


@app.route('/api/event/<event_id>/<registration_date>')
@login_required
def api_event_get(event_id, registration_date):
    sf = SFEvent()
    event, registrations = sf.event_by_id(event_id, registration_date)
    event["registrations"] = registrations
    app.logger.debug(event)
    return jsonify(response="Success", data=event)
