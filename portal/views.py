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
    contact, small_groups = sf.person_by_id(contact_id)
    contact['small_groups'] = small_groups

    app.logger.debug(contact)
    return jsonify(response="Success", person=contact)
