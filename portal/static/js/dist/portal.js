App = Ember.Application.create({
    LOG_TRANSITIONS: true
});

// Router

App.Router.map(function() {
    this.resource('index', { path: '/' });
    this.resource('people', { path: '/people' }, function() {
        this.resource('person', { path: '/:Id' });
    });
    this.resource('team', { path: '/team'});
    this.resource('contact', { path: '/contact'});
    this.resource('events', { path: '/events'});
    this.resource('event_kidswork', { path: '/event/:Id/kidswork' });
    this.resource('event', { path: '/event/:Id' });
});

;App.ContactController = Ember.ObjectController.extend({
    categoriesUnselected: [{name:'Department Coordinators'}, {name:'Elders'}, {name:'Life Leaders'}, {name:'Partner'}, {name:'Senior Management'}, {name:'Trustees'}],
    categoriesSelected: [],
    contactIds: [],
    members: [],
    teamsUnselected: [],
    teamsSelected: [],
    smallGroupsUnselected: [],
    smallGroupsSelected: [],
    inProgress: false,

    getPermissions: function() {
        getPermissions(this);
    },

    reset: function() {
        var teams = this.get("model").teams;
        this.set("teamsUnselected", teams);
    },

    refreshTeamsView: function() {
        // Get a list of team IDs of the selected teams
        var controller = this;
        var selectedTeamIds = [];
        var selectedGroupIds = [];
        var selectedCategories = [];

        // Sort the teams/categories lists by name
        var sorted = controller.get("teamsSelected").sortBy('Name');
        var sortedUn = controller.get("teamsUnselected").sortBy('Name');
        var sortedCategories = controller.get("categoriesUnselected").sortBy('name');
        controller.set("teamsSelected", sorted);
        controller.set("teamsUnselected", sortedUn);
        controller.set("categoriesUnselected", sortedCategories);

        controller.get("teamsSelected").forEach(function(t) {
            selectedTeamIds.push(t.Id);
        });
        controller.get("smallGroupsSelected").forEach(function(t) {
            selectedGroupIds.push(t.Id);
        });
        controller.get("categoriesSelected").forEach(function(t) {
            selectedCategories.push(t.name);
        });

        // Fetch the members of the selected team and add to member list
        App.Contact.team_members(selectedTeamIds, selectedGroupIds, selectedCategories).then(function (data) {
            var members = [];
            data.members.forEach(function(m) {
                if (m.Email) {
                    members.push(m);
                }
            });
            controller.set("members", members);
            controller.set("people", data.members.sortBy('Name'));
            controller.set("inProgress", false);
        });
    },

    actions: {
        selectTeam: function(team) {
            this.set("inProgress", true);

            // Toggle the selection of the team
            var index = this.get("teamsSelected").indexOf(team);
            if (index >= 0) {
                // The team is already selected
                return;
            }

            // Add the team to the list of selected teams
            this.get("teamsSelected").pushObject(team);

            // Remove the team from the unselected team list
            this.get("teamsUnselected").removeObject(team);

            // Refresh the teams and membership list in the view
            this.refreshTeamsView();
        },

        deselectTeam: function(team) {
            var controller = this;
            controller.set("inProgress", true);

            // Remove the team from the selected teams list
            controller.get("teamsSelected").removeObject(team);

            // Add the team to the unselected teams list
            controller.get("teamsUnselected").addObject(team);

            // Refresh the teams and membership list in the view
            controller.refreshTeamsView();
        },

        selectSmallGroup: function(sg) {
            this.set("inProgress", true);

            // Check if the small group is selected
            var index = this.get("smallGroupsSelected").indexOf(sg);
            if (index >= 0) {
                // The small group is already selected
                return;
            }

            // Add the small group to the list of selected groups
            this.get("smallGroupsSelected").pushObject(sg);

            // Remove the small group to the unselected groups list
            this.get("small_groups").removeObject(sg);

            // Refresh the teams and membership list in the view
            this.refreshTeamsView();
        },

        deselectSmallGroup: function(sg) {
            this.set("inProgress", true);

            // Remove the small group from the selected groups list
            this.get("smallGroupsSelected").removeObject(sg);

            // Add the small group to the unselected groups list
            this.get("small_groups").pushObject(sg);

            // Refresh the teams and membership list in the view
            this.refreshTeamsView();
        },

        selectCategory: function(category) {
            this.set("inProgress", true);

            // Toggle the selection of the category
            var index = this.get("categoriesSelected").indexOf(category);
            if (index >= 0) {
                // The category is already selected
                return;
            }

            // Add the category to the list of selected teams
            this.get("categoriesSelected").pushObject(category);

            // Remove the category from the unselected category list
            this.get("categoriesUnselected").removeObject(category);

            // Refresh the teams and membership list in the view
            this.refreshTeamsView();
        },

        deselectCategories: function(category) {
            this.set("inProgress", true);

            // Remove the category from the selected groups list
            this.get("categoriesSelected").removeObject(category);

            // Add the small group to the unselected groups list
            this.get("categoriesUnselected").pushObject(category);

            // Refresh the teams and membership list in the view
            this.refreshTeamsView();
        }
    }
});
;App.EventController = Ember.ObjectController.extend({
    loading: false,
    registration_date: moment().format('YYYY-MM-DD'),
    searchResultsComplete: [],
    searchResults: [],
    filteredCount: 0,
    type_options: [{name:'ALL', selected: true},
                     {name:'Child', selected:false},
                     {name:'Youth', selected:false},
                     {name:'Adult', selected:false},
                     {name:'Senior', selected: false}],
    type: 'ALL',

    reset: function() {
        console.log('reset');
        this.set('filteredCount', this.get('registrations').length);
        this.set('filteredRegistrations', this.filter());
    }.observes('registrations'),

    getPermissions: function() {
        getPermissions(this);
    },

    getRegistrations: function() {
        console.log('getRegistrations');
        var controller = this;
        controller.set('loading', true);
        App.Event.findById(controller.get("model").Id, controller.get("registration_date")).then(function(data) {
            controller.set('model', data.data);
            controller.set('registrations', data.data.registrations);
            controller.set('loading', false);
        });
    }.observes("registration_date"),

    findPeople: function() {
        console.log('findPeople');
        // Get all the people
        var name = '';
        var controller = this;
        controller.set('loading', true);
        App.Event.findPerson(controller.get("model").Id, controller.get("registration_date"),
            controller.get("model").Type__c, name).then(function(data) {
                controller.set('searchResultsComplete', data.data.records);
                controller.set('searchResults', data.data.records);
                controller.set('loading', false);
        });
    },

    filter: function() {
        var group = this.get('type');
        var registrations = this.get('registrations');
        var search = this.get('searchResultsComplete');

        // Filter the lists based on the group
        if (group != 'ALL') {
            var rx = new RegExp(group, 'gi');
            registrations = registrations.filter(function (r) {
                return r.Type.match(rx);
            });
            search = search.filter(function (r) {
                return r.Contact_Type__c.match(rx);
            });
        }

        this.set('filteredCount', registrations.length);
        this.set('searchResults', search);
        return registrations;
    },

    filteredRegistrations: function() {
        console.log('filteredRegistrations');
        return this.filter();
    }.property('arrangedContent', 'type'),

    isKidswork: function() {
        if (this.get('model.Type__c') == 'Kidswork') {
            return true;
        } else {
            return false;
        }
    }.property('model.Type__c'),

    setOption: function(opt, optName, optListName) {
        var options = [];
        var controller = this;
        controller.set(optName, opt.name);
        controller.get(optListName).forEach(function(st) {
            if (controller.get(optName) == st.name) {
                st.selected = true;
                options.push(st);
            } else {
                st.selected = false;
                options.push(st);
            }
        });
        return options;
    },

    actions: {
        setTypeGroup: function(opt) {
            this.set('type', opt.name);
            this.set('filteredRegistrations', this.filter());
            var options =  this.setOption(opt, 'type', 'type_options');
            this.set('type_options', options);
        },

        signInNew: function(person) {
            var controller = this;

            var eventId = controller.get('model.Id');
            var registrationDate = controller.get('registration_date');
            var personId = person.Id;

            App.Event.signInNew(eventId, registrationDate, personId, 'Attended').then(function(data) {
                controller.set('registrations', data.registrations);

                // Remove the person from the search results
                controller.set('searchResults', controller.get('searchResults').without(person));
                controller.set('searchResultsComplete', controller.get('searchResultsComplete').without(person));
            });
        }.observes('registrations', 'searchResults', 'searchResultsComplete'),

        remove: function(r) {
            var controller = this;

            App.Event.remove(r.Id).then(function(data) {
                controller.set('registrations', data.registrations);
            });
        }.observes('registrations')
    }
});


App.EventKidsworkController = Ember.ObjectController.extend({
    loading: false,
    registration_date: moment().format('YYYY-MM-DD'),
    searchResults: [],
    personInfo: {},

    getPermissions: function() {
        getPermissions(this);
    },

    getRegistrations: function() {
        var controller = this;
        controller.set('loading', true);
        App.Event.findById(controller.get("model").Id, controller.get("registration_date")).then(function(data) {
            controller.set('model', data.data);
            controller.set('registrations', data.data.registrations);
            controller.set('loading', false);
        });
    }.observes("registration_date"),

    totalPrimary: function() {
        return this.get('model.registrations').filterBy('isPrimary', true).length;
    }.property('registrations'),

    totalPreschool: function() {
        return this.get('model.registrations').filterBy('isPreschool', true).length;
    }.property('registrations'),

    findPeople: function() {
        // Only perform the search if a name is entered
        var name = this.get('find_name');
        if (name) {
            name = name.replace(/^\s+|\s+$/g,'');
            if (name.length === 0) {
                return;
            }
        } else {
            return;
        }

        var controller = this;
        controller.set('loading', true);
        App.Event.findPerson(controller.get("model").Id, controller.get("registration_date"),
            controller.get("model").Type__c, name).then(function(data) {
                controller.set('searchResults', data.data.records);
                controller.set('loading', false);
        });
    },

    actions: {
        findPeople: function() {
            this.findPeople();
        },

        showPerson: function(personId) {
            var controller = this;

            // Get the person's details
            App.Person.findById(personId).then(function(data) {
                controller.set('personInfo', data.person);

                // Show the person details dialog
                Ember.$('#personInfoModal').modal('show');
            });
        },

        clearSearch: function() {
            this.set('searchResults', []);
            this.set('find_name', null);
        },

        signInNew: function(person) {
            var controller = this;

            var people = controller.get("searchResults").map(function(p) {
               if (p.Id != person.Id) {
                   p.selected = false;
               } else {
                   p.selected = true;
               }
                return p;
            });
            controller.set("searchResults", people);

            var eventId = controller.get('model.Id');
            var registrationDate = controller.get('registration_date');
            var personId = person.Id;

            App.Event.signInNew(eventId, registrationDate, personId).then(function(data) {
                controller.set('registrations', data.registrations);
                controller.get("searchResults").removeObject(person);
            });
        }.observes('registrations'),

        signIn: function(r) {
            var controller = this;

            App.Event.signIn(r.Id).then(function(data) {
                controller.set('registrations', data.registrations);
            });
        }.observes('registrations'),

        signOut: function(r) {
            var controller = this;

            App.Event.signOut(r.Id).then(function(data) {
                controller.set('registrations', data.registrations);
            });
        }.observes('registrations'),

        remove: function(r) {
            var controller = this;

            App.Event.remove(r.Id).then(function(data) {
                controller.set('registrations', data.registrations);
            });
        }.observes('registrations')
    }
});
;
App.PeopleController = Ember.ArrayController.extend({

    getPermissions: function() {
        getPermissions(this);
    },

    findPeople: function() {
        // Only perform the search if a name is entered
        var name = this.get('find_name');
        if (name) {
            name = name.replace(/^\s+|\s+$/g,'');
            if (name.length == 0) {
                return;
            }
        } else {
            return;
        }

        var data = {
            name: name
        };

        var controller = this;
        App.Person.find(data).then(function(data) {
            var results = data.results;

            controller.get('content').setObjects(results.records);
        }).catch(function(error) {
            controller.set('error', error.message);
        });
    },

    actions: {
        findPeople: function () {
            this.findPeople();
        },

        clearFind: function() {
            this.set('find_name', null);
            this.transitionToRoute('index');
        }
    }
});


App.PersonController = Ember.ObjectController.extend({

    isAdmin: false,
    isLeader: false,

    getPermissions: function() {
        getPermissions(this);
    },

    actions: {
        toggleTeam: function(team) {
            // Toggle the team membership
            var teams = [];
            var controller = this;

            App.Person.updateTeam(
                this.get("model").Id, team.team_id).then(function(data) {
                team.in_team = data.team.in_team;

                // Update the view
                controller.get("model").team_serving.forEach(function (t) {
                    if (t.team_id==team.team_id) {
                        teams.push(team);
                    } else {
                        teams.push(t);
                    }
                });
                controller.get("model").team_serving.setObjects(teams);
            }).catch(function(error) {
                controller.set('error', error.message);
            });
        }.observes('team_serving'),

        toggleCoreTeam: function(team) {
            // Toggle the core team membership
            var teams = [];
            var controller = this;

            App.Person.updateCoreTeam(
                this.get("model").Id, team.team_id).then(function(data) {
                team.in_team = data.team.in_team;
                team.access_manage =  data.team.access_manage;
                team.access_contact =  data.team.access_contact;

                // Update the view
                controller.get("model").core_teams.forEach(function (t) {
                    if (t.team_id==team.team_id) {
                        teams.push(team);
                    } else {
                        teams.push(t);
                    }
                });
                controller.get("model").core_teams.setObjects(teams);
            }).catch(function(error) {
                controller.set('error', error.message);
            });
        }.observes('core_teams'),

        toggleSmallGroup: function(sg) {
            // Toggle the small group membership
            var groups = [];
            var controller = this;

            App.Person.updateSmallGroup(
                this.get("model").Id, sg.group_id).then(function(data) {

                sg.in_group = data.small_group.in_group;
                sg.leader = data.small_group.leader;

                controller.get("model").small_groups.forEach(function (t) {
                    if (t.group_id==sg.group_id) {
                        groups.push(sg);
                    } else {
                        groups.push(t);
                    }
                });
                controller.get("model").small_groups.setObjects(groups);
            }).catch(function(error) {
                controller.set('error', error.message);
            });
        }.observes('small_groups'),

        toggleTeamPermissions: function(team) {
            // Toggle the team permissions
            var teams = [];
            var controller = this;

            App.Person.updateTeamPermissions(
                this.get("model").Id, team.team_id).then(function(data) {
                team.in_team = data.team.in_team;
                team.access_manage =  data.team.access_manage;
                team.access_contact =  data.team.access_contact;

                // Update the view
                controller.get("model").team_permissions.forEach(function (t) {
                    if (t.team_id==team.team_id) {
                        teams.push(team);
                    } else {
                        teams.push(t);
                    }
                });
                controller.get("model").team_permissions.setObjects(teams);
            }).catch(function(error) {
                controller.set('error', error.message);
            });
        }.observes('team_permissions'),

        toggleCheckbox: function(model, field) {
            // Toggle the department coordinator flag
            var value = !this.get('model')[field];
            App.Person.toggleCheckbox(model.Id, field);
            this.set('model.' + field, value);
        }
    }
});
;var DATE_FORMAT = 'DD/MM/YYYY';

// Ajax wrapper that returns a promise
function ajax (url, options) {
  return new Ember.RSVP.Promise(function (resolve, reject) {
    options = options || {};
    options.url = url;

    Ember.$.ajax(options).done(function (data) {
        if (data.response == 'Success') {
            resolve(data);
        } else {
            // Return error for validation errors
            reject(new Error(data.message));
        }
    }).fail(function (jqxhr, status, something) {
        reject(new Error("AJAX: `" + url + "` failed with status: [" + status + "] " + something));
    });
  });
}


Ember.Handlebars.registerBoundHelper('formatDate', function(date) {
    if (date) {
        return moment(date, 'YYYY-MM-DD').format(DATE_FORMAT);
    } else {
        return '';
    }
});


Ember.Handlebars.registerBoundHelper('formatNotes', function(notes) {
    if (notes) {
        return notes.replace('\n', '\n ').split('\n');
    } else {
        return [''];
    }
});


Ember.Handlebars.registerBoundHelper('formatPicklist', function(notes) {
    if (notes) {
        return notes.replace(';', '; ');
    } else {
        return '';
    }
});


Ember.Handlebars.registerBoundHelper('emailList', function(members) {
    return members.map(function(item) {
        return item.Name + " <" + item.Email + ">";
    }).join(", ");
});


// Date picker widget for view
App.CalendarDatePicker = Ember.TextField.extend({
    _picker: null,

    modelChangedValue: function(){
        var picker = this.get("_picker");
        if (picker){
            picker.setDate(this.get("value"));
        }
    }.observes("value"),

    didInsertElement: function(){
        var currentYear = (new Date()).getFullYear();
        var formElement = this.$()[0];
        var picker = new Pikaday({
            field: formElement,
            yearRange: [1900,currentYear+2],
            format: 'YYYY-MM-DD'
        });
        this.set("_picker", picker);
    },

    willDestroyElement: function(){
        var picker = this.get("_picker");
        if (picker) {
            picker.destroy();
        }
        this.set("_picker", null);
    }
});


App.Person = Ember.Object.extend({});

App.Person.reopenClass({
    url: '/api/people',

    getAll: function (pageNo) {
        var url = this.url;
        if (pageNo) {
            url = this.url + '/page/' + pageNo;
        }
        return ajax(url, {
            type: 'GET',
            contentType: "application/json; charset=utf-8"
        });
    },

    find: function(data) {
        return ajax(this.url + '/find', {
            type: 'POST',
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    findById: function(modelId) {
        if ((!modelId) || (modelId === 'undefined')) {
            modelId = 'me';
        }
        return ajax(this.url + '/' + modelId, {
            type: 'GET',
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    updateTeam: function(contactId, teamId) {
        console.log('updateTeam');
        console.log(teamId);
        return ajax(this.url + '/' + contactId + '/team/' + teamId, {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    updateCoreTeam: function(contactId, teamId) {
        return ajax(this.url + '/' + contactId + '/core_team/' + teamId, {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    updateTeamPermissions: function(contactId, teamId) {
        return ajax(this.url + '/' + contactId + '/team_permissions/' + teamId, {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    updateSmallGroup: function(contactId, groupId) {
        return ajax(this.url + '/' + contactId + '/small_group/' + groupId, {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    toggleCheckbox: function(contactId, field) {
        return ajax(this.url + '/' + contactId + '/toggle', {
            type: 'POST',
            data: JSON.stringify({field: field}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    permissions: function() {
        return ajax('/api/permissions', {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    }

});


App.Contact = Ember.Object.extend({});

App.Contact.reopenClass({
    url: '/api/contact',

    all: function() {
        return ajax(this.url, {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    teams: function() {
        return ajax(this.url + '/teams', {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    team_members: function(selectedTeamIds, selectedGroupIds, selectedCategories) {
        return ajax(this.url + '/teams/selected', {
            type: 'POST',
            data: JSON.stringify({
                selected_teams: selectedTeamIds,
                selected_small_groups: selectedGroupIds,
                selected_categories: selectedCategories
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    }

});


App.Event = Ember.Object.extend({});

App.Event.reopenClass({
    url: '/api/event',

    all: function() {
        return ajax(this.url, {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    findById: function(modelId, registration_date) {
        if (!registration_date) {
            var d = new Date();
            registration_date = d.toJSON().slice(0, 10);
        }
        return ajax(this.url + '/' + modelId + '/' + registration_date, {
            type: 'GET',
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    findPerson: function(modelId, registration_date, type, find_name) {
        return ajax(this.url + '/' + modelId + '/' + registration_date + '/find_person', {
            type: 'POST',
            data: JSON.stringify({
                find_name: find_name,
                type: type
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    signInNew: function(eventId, registrationDate, personId, status) {
        if (!status) {
            status = 'Signed-In';
        }
        return ajax(this.url + '/registration/new', {
            type: 'POST',
            data: JSON.stringify({
                event_id: eventId,
                registration_date: registrationDate,
                person_id: personId,
                status: status
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    signIn: function(registrationId) {
        return ajax(this.url + '/registration/' + registrationId, {
            type: 'POST',
            data: JSON.stringify({
                action: 'Signed-In'
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    signOut: function(registrationId) {
        return ajax(this.url + '/registration/' + registrationId, {
            type: 'POST',
            data: JSON.stringify({
                action: 'Signed-Out'
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    remove: function(registrationId) {
        return ajax(this.url + '/registration/' + registrationId, {
            type: 'POST',
            data: JSON.stringify({
                action: 'Delete'
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    }
});


App.Team = Ember.Object.extend({});

App.Team.reopenClass({
    url: '/api/team',

    all: function() {
        return ajax(this.url, {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    }

});
;function getPermissions(controller) {
    App.Person.permissions().then(function(result) {
        controller.set('permissions', result.permissions);

        var isStandard = true;
        var isAdmin = false;
        var isLeader = false;
        var isEvents = false;
        if (controller.get("permissions")) {
            if (controller.get("permissions").role=="Admin") {
                isAdmin = true;
                isLeader = true;
                isStandard = false;
            } else if (controller.get("permissions").role=="Leader") {
                isLeader = true;
                isStandard = false;
            } else if (controller.get("permissions").role=="Events") {
                isEvents = true;
                isStandard = false;
            }
        }
        controller.set('isAdmin', isAdmin);
        controller.set('isLeader', isLeader);
        controller.set('isStandard', isStandard);
        controller.set('isEvents', isEvents);
    });
}

App.IndexRoute = Ember.Route.extend({
    beforeModel: function() {
        this.transitionTo('people');
    }
});

App.PeopleRoute = Ember.Route.extend({
    model: function(params) {
        return [];
    },

    setupController: function(controller, model) {
        controller.set('content', model);
        getPermissions(controller);

        // Run the search
        controller.findPeople();
    }

});

App.PersonRoute = Ember.Route.extend({
    model: function(params) {
        if (params.id === 'undefined') {
            this.transitionTo('person', 'me');
        }
        return App.Person.findById(params.Id).then( function(data) {
            return data.person;
        });
    },

    setupController: function(controller, model) {
        controller.set('content', model);
        getPermissions(controller);
    }
});

App.ContactRoute = Ember.Route.extend({
    model: function() {
        return App.Contact.all().then( function(data) {
            return data.data;
        });
    },

    setupController: function(controller, model) {
        controller.set('content', model);
        getPermissions(controller);
        controller.reset();
    }

});

App.EventsRoute = Ember.Route.extend({
    model: function() {
        return App.Event.all().then( function(data) {
            return data.data;
        });
    },

    setupController: function(controller, model) {
        controller.set('content', model);
        getPermissions(controller);
    }
});

App.EventRoute = Ember.Route.extend({
    model: function(params) {
        return App.Event.findById(params.Id).then( function(data) {
            return data.data;
        });
    },

    setupController: function(controller, model) {
        controller.set('content', model);
        controller.findPeople();
        getPermissions(controller);
    }
});

App.EventKidsworkRoute = Ember.Route.extend({
    model: function(params) {
        return App.Event.findById(params.Id).then( function(data) {
            return data.data;
        });
    },

    setupController: function(controller, model) {
        controller.set('content', model);
        getPermissions(controller);
    }
});

App.TeamRoute = Ember.Route.extend({
    model: function(params) {
        return App.Team.all().then( function(data) {
            return data.teams;
        });
    },

    setupController: function(controller, model) {
        controller.set('content', model);
        getPermissions(controller);
    }
});
;
App.TeamController = Ember.ArrayController.extend({

    getPermissions: function() {
        getPermissions(this);
    },

    findTeams: function() {
        var controller = this;

        App.Team.all().then(function(data) {
            console.log(data.teams);

        }).catch(function(error) {
            controller.set('error', error.message);
        });
    },

    removePerson: function(person) {
        this.get("people").removeObject(person);
    },

    actions: {
        selectTeam: function(team) {
            var controller = this;
            controller.set("inProgress", true);
            team.Id = team.team_id;
            controller.set('selectedTeam', team);

            // Make sure that only this team is selected
            var teams = [];
            controller.get('model').forEach(function(t) {
                if (t.team_id == team.team_id) {
                    t.selected = true;
                } else {
                    t.selected = false;
                }
                teams.push(t);
            });
            controller.set("model", teams);

            // Fetch the members of the selected team and add to member list
            App.Contact.team_members([team], [], []).then(function (data) {
                controller.set("people", data.members.sortBy('Name'));
                controller.set("inProgress", false);
            });
        },

        removeFromGroup: function(person, team) {
            var controller = this;

            if (person.is_core_team) {
                App.Person.updateCoreTeam(person.Id, team.team_id).then(function(data) {
                    // Remove the person from the members list
                    controller.removePerson(person);
                }).catch(function(error) {
                    controller.set('error', error.message);
                });
            } else {
                App.Person.updateTeam(person.Id, team.team_id).then(function (data) {
                    // Remove the person from the members list
                    controller.removePerson(person);
                }).catch(function (error) {
                    controller.set('error', error.message);
                });
            }
        }
    }
});
