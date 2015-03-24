App = Ember.Application.create({
    LOG_TRANSITIONS: true
});

// Router

App.Router.map(function() {
    this.resource('index', { path: '/' });
    this.resource('people', { path: '/people' });
    this.resource('person', { path: '/person/:Id' });
    this.resource('contact', { path: '/contact'});
    this.resource('events', { path: '/events'});
    this.resource('event_kidswork', { path: '/event/:Id/kidswork' });
    this.resource('event', { path: '/event/:Id' });
});

;App.ContactController = Ember.ObjectController.extend({
    contactIds: [],
    members: [],
    teamsUnselected: [],
    teamsSelected: [],
    smallGroupsUnselected: [],
    smallGroupsSelected: [],
    inProgress: false,

    reset: function() {
        var teams = this.get("model").teams;
        this.set("teamsUnselected", teams);
    },

    refreshTeamsView: function() {
        // Get a list of team IDs of the selected teams
        var controller = this;
        var selectedTeamIds = [];
        var selectedGroupIds = [];
        controller.get("teamsSelected").forEach(function(t) {
            selectedTeamIds.push(t.Id);
        });
        controller.get("smallGroupsSelected").forEach(function(t) {
            selectedGroupIds.push(t.Id);
        });

        // Fetch the members of the selected team and add to member list
        App.Contact.team_members(selectedTeamIds, selectedGroupIds).then(function (data) {
            var members = [];
            data.members.forEach(function(m) {
                if (m.Email) {
                    members.push(m);
                }
            });
            controller.set("members", members);
            controller.set("inProgress", false);
        });
    },

    actions: {
        selectTeam: function(team) {
            var controller = this;
            controller.set("inProgress", true);

            // Toggle the selection of the team
            var index = controller.get("teamsSelected").indexOf(team);
            if (index >= 0) {
                // The team is already selected
                return;
            }

            // Add the team to the list of selected teams
            controller.get("teamsSelected").pushObject(team);

            // Remove the team from the unselected team list
            var index = controller.get("teamsUnselected").indexOf(team);
            controller.get("teamsUnselected").splice(index, 1);

            // Refresh the teams and membership list in the view
            controller.refreshTeamsView();
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
            var controller = this;
            controller.set("inProgress", true);

            // Check if the small group is selected
            var index = controller.get("smallGroupsSelected").indexOf(sg);
            if (index >= 0) {
                // The small group is already selected
                return;
            }

            // Add the small group to the list of selected groups
            controller.get("smallGroupsSelected").pushObject(sg);

            // Refresh the teams and membership list in the view
            controller.refreshTeamsView();
        },

        deselectSmallGroup: function(sg) {
            var controller = this;
            controller.set("inProgress", true);

            // Remove the small group from the selected groups list
            controller.get("smallGroupsSelected").removeObject(sg);

            // Add the small group to the unselected groups list
            controller.get("smallGroupsUnselected").addObject(sg);

            // Refresh the teams and membership list in the view
            controller.refreshTeamsView();
        }
    }
});
;App.EventController = Ember.ObjectController.extend({
    registration_date: moment().format('YYYY-MM-DD'),
    status_options: [{name:'ALL', selected: true},
                     {name:'Attended', selected: false},
                     {name:'Signed-In', selected:false},
                     {name:'Signed-Out', selected:false}],
    status: 'ALL',
    filteredCount: 0,
    type_options: [{name:'ALL', selected: true},
                     {name:'Child', selected:false},
                     {name:'Youth', selected:false},
                     {name:'Adult', selected:false},
                     {name:'Senior', selected: false}],
    type: 'ALL',
    kids_options: [{name:'ALL', selected: true},
                     {name:'Preschool', selected: false},
                     {name:'Primary', selected:false}],
    kids: 'ALL',

    reset: function() {
        this.set('status', null);
        this.set('status', 'ALL');
        this.set('filteredCount', this.get('model').registrations.length);
    }.observes('model.registrations'),

    getRegistrations: function() {
        var controller = this;
        App.Event.findById(controller.get("model").Id, controller.get("registration_date")).then(function(data) {
            controller.set('model', data.data);
            controller.set('model.registrations', data.data.registrations);
        });
    }.observes("registration_date"),

    filter: function() {
        var status = this.get('status');
        var group;
        if (this.get('model.Type__c') == 'Kidswork') {
            group = this.get('kids');
        } else {
            group = this.get('type');
        }


        if ((status == 'ALL') && (group == 'ALL')) {
            this.set('filteredCount', this.get('model.registrations').length);
            return this.get('model.registrations');
        }

        var filtered;

        // Filter the list based on the status
        if (status == 'ALL') {
            filtered = this.get('model.registrations');
        } else {
            var rx = new RegExp(status, 'gi');
            filtered = this.get('model.registrations').filter(function (r) {
                return r.Status.match(rx);
            });
        }

        // Filter the list based on the group
        if (group != 'ALL') {
            var rx = new RegExp(group, 'gi');
            if (this.get('model.Type__c') == 'Kidswork') {
                filtered = filtered.filter(function (r) {
                    return r.KidsGroup.match(rx);
                });
            } else {
                filtered = filtered.filter(function (r) {
                    return r.Type.match(rx);
                });
            }
        }

        this.set('filteredCount', filtered.length);
        return filtered;
    },

    filteredRegistrations: function() {
        return this.filter();
    }.property('arrangedContent', "status", "type", "kids"),

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
        setStatus: function(opt) {
            this.set('status', opt.name);
            var options =  this.setOption(opt, 'status', 'status_options');
            this.set('status_options', options);
        },

        setKidsGroup: function(opt) {
            this.set('kids', opt.name);
            var options =  this.setOption(opt, 'kids', 'kids_options');
            this.set('kids_options', options);
        },

        setTypeGroup: function(opt) {
            this.set('type', opt.name);
            var options =  this.setOption(opt, 'type', 'type_options');
            this.set('type_options', options);
        }
    }
});


App.EventKidsworkController = Ember.ObjectController.extend({
    registration_date: moment().format('YYYY-MM-DD'),
    searchResults: [],
    personInfo: {},

    getRegistrations: function() {
        var controller = this;
        App.Event.findById(controller.get("model").Id, controller.get("registration_date")).then(function(data) {
            controller.set('model', data.data);
            controller.set('model.registrations', data.data.registrations);
        });
    }.observes("registration_date"),

    totalPrimary: function() {
        return this.get('model.registrations').filterBy('isPrimary', true).length;
    }.property('model.registrations'),

    totalPreschool: function() {
        return this.get('model.registrations').filterBy('isPreschool', true).length;
    }.property('model.registrations'),

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

        var controller = this;
        App.Event.findPerson(controller.get("model").Id, controller.get("registration_date"),
            controller.get("model").Type__c, name).then(function(data) {
                controller.set('searchResults', data.data.records);
        });
    },

    actions: {
        findPeople: function() {
            this.findPeople();
        },

        showPerson: function(r) {
            var controller = this;

            // Get the person's details
            App.Person.findById(r.PersonId).then(function(data) {
                controller.set('personInfo', data.person);

                // Show the person details dialog
                Ember.$('#personInfoModal').modal('show');
            });
        },

        signIn: function(r) {
            var controller = this;

            App.Event.signIn(r.Id).then(function(data) {
                controller.get('model.registrations').setObjects(data.registrations);
            });
        }.observes('registrations'),

        signOut: function(r) {
            var controller = this;

            App.Event.signOut(r.Id).then(function(data) {
                controller.get('model').registrations.setObjects(data.registrations);
            });
        }.observes('registrations')
    }
});
;App.PeopleController = Ember.ArrayController.extend({

    getPermissions: function() {
        var controller = this;
        App.Person.permissions().then(function(result) {
            controller.set('permissions', result.permissions);
        });
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
        var controller = this;
        App.Person.permissions().then(function(result) {
            controller.set('permissions', result.permissions);

            var isAdmin = false;
            var isLeader = false;
            if (controller.get("permissions")) {
                if (controller.get("permissions").role=="Admin") {
                    isAdmin = true;
                    isLeader = true;
                } else if (controller.get("permissions").role=="Leader") {
                    isLeader = true;
                }
            }
            controller.set('isAdmin', isAdmin);
            controller.set('isLeader', isLeader);
        });
    },

    actions: {
        toggleTeam: function(team) {
            // Toggle the team membership
            var teams = [];
            var controller = this;

            App.Person.updateTeam(
                this.get("model").Id, team.team_id).then(function(data) {
                team.in_team = data.team.in_team;
                team.access_manage =  data.team.access_manage;
                team.access_contact =  data.team.access_contact;

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
        console.log(data);
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

    team_members: function(selectedTeamIds, selectedGroupIds) {
        return ajax(this.url + '/teams/selected', {
            type: 'POST',
            data: JSON.stringify({
                selected_teams: selectedTeamIds,
                selected_small_groups: selectedGroupIds
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
;App.IndexRoute = Ember.Route.extend({
    beforeModel: function() {
        this.transitionTo('people');
    }
});

App.PeopleRoute = Ember.Route.extend({
    model: function(params) {
        return [];
    },

    setupController: function(controller, model) {
        console.log("Setup PeopleRoute");
        controller.set('content', model);
        controller.getPermissions();

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
        console.log("Setup PersonRoute");
        controller.set('content', model);
        controller.getPermissions();
    }
});

App.ContactRoute = Ember.Route.extend({
    model: function() {
        return App.Contact.all().then( function(data) {
            return data.data;
        });
    },

    setupController: function(controller, model) {
        console.log("Setup ContactRoute");
        controller.set('content', model);
        controller.reset();
    }

});

App.EventsRoute = Ember.Route.extend({
    model: function() {
        return App.Event.all().then( function(data) {
            return data.data;
        });
    }
});

App.EventRoute = Ember.Route.extend({
    model: function(params) {
        return App.Event.findById(params.Id).then( function(data) {
            return data.data;
        });
    },

    setupController: function(controller, model) {
        console.log("Setup EventRoute");
        controller.set('content', model);
    }
});

App.EventKidsworkRoute = Ember.Route.extend({
    model: function(params) {
        return App.Event.findById(params.Id).then( function(data) {
            return data.data;
        });
    },

    setupController: function(controller, model) {
        console.log("Setup EventKidsworkRoute");
        controller.set('content', model);
    }
});
