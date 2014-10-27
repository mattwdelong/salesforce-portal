App = Ember.Application.create({
    LOG_TRANSITIONS: true
});

// Router

App.Router.map(function() {
    this.resource('index', { path: '/' });
    this.resource('people', { path: '/people' });
    this.resource('person', { path: '/person/:Id' });
    this.resource('contact', { path: '/contact'});
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

    getPermissions: function() {
        var controller = this;
        App.Person.permissions().then(function(result) {
            controller.set('permissions', result.permissions);
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
        }.observes('small_groups')
    }
});

App.ContactController = Ember.ObjectController.extend({
    contactIds: [],
    members: [],
    teamsUnselected: [],
    teamsSelected: [],

    reset: function() {
        var teams = this.get("model").teams;
        this.set("teamsUnselected", teams);
    },

    actions: {
        selectTeam: function(team) {
            // Select the team
            var controller = this;

            // Toggle the selection of the team
            var index = controller.get("teamsSelected").indexOf(team);
            if (index >= 0) {
                // The team is already selected
                return;
            }

            // Add the team to the list of selected teams
            var selTeams = controller.get("teamsSelected");
            controller.get("teamsSelected").addObject(team);

            // Remove the team from the unselected team list
            var unselectedIndex = controller.get("teamsUnselected").indexOf(team);
            var unselected = controller.get("teamsUnselected");
            unselected.splice(unselectedIndex, 1);
            controller.set("teamsUnselected", unselected);

            // Get a list of team IDs of the selected teams
            var selectedTeamIds = [];
            selTeams.forEach(function(t) {
                selectedTeamIds.push(t.Id);
            });

            // Fetch the members of the selected team and add to member list

            App.Contact.team_members(selectedTeamIds).then(function (data) {
                controller.set("members", data.members);
            });
        },

        deselectTeam: function(team) {
            console.log("Deselect team");
            // Remove the team from the selected teams list

            // Add the team to the unselected teams list

            // Update the member list from the selected teams list
        }
    }
});
;
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

    updateSmallGroup: function(contactId, groupId) {
        return ajax(this.url + '/' + contactId + '/small_group/' + groupId, {
            type: 'POST',
            data: JSON.stringify({}),
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

    team_members: function(selectedTeamIds) {
        return ajax(this.url + '/teams/selected', {
            type: 'POST',
            data: JSON.stringify({selected_teams: selectedTeamIds}),
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
            console.log(data.person.small_groups.records);
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
        //controller.getPermissions();
        controller.reset();
    }

});
