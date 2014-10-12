from flask import render_template, jsonify, request
from portal import app
from portal.models.sf import SFPerson
from portal.utils import is_testing


@app.route('/')
def hello_world():
    return '<h1>Hello World!</h1>'


@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/api/people')
@app.route('/api/people/page')
@app.route('/api/people/page/<int:page_no>')
def api_people(page_no=1):
    sf = SFPerson()
    results = sf.get_all()

    return jsonify(response="Success", results=results)


@app.route('/api/people/find', methods=['POST'])
def api_people_find():
    name = request.json.get('name')
    sf = SFPerson()
    results = sf.find(name)
    return jsonify(response="Success", results=results)


@app.route('/api/people/<contact_id>')
def api_person_get(contact_id):
    sf = SFPerson()
    contact, small_groups, teams = sf.person_by_id(contact_id)
    contact['small_groups'] = small_groups
    contact['team_serving'] = teams

    return jsonify(response="Success", person=contact)

@app.route('/api/people/<contact_id>/team/<team_id>', methods=['POST'])
def api_person_team(contact_id, team_id):
    sf = SFPerson()
    team = sf.person_team_serving_update(contact_id, team_id)
    return jsonify(response="Success", team=team)

@app.route('/api/people/<contact_id>/small_group/<group_id>', methods=['POST'])
def api_person_small_group(contact_id, group_id):
    sf = SFPerson()
    small_group = sf.person_small_group_update(contact_id, group_id)
    return jsonify(response="Success", small_group=small_group)
