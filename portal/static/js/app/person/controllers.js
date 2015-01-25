App.PeopleController = Ember.ArrayController.extend({

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

    getPermissions: function() {
        var controller = this;
        App.Person.permissions().then(function(result) {
            controller.set('permissions', result.permissions);

            var isAdmin = false;
            if (controller.get("permissions")) {
                if (controller.get("permissions").role=="Admin") {
                    isAdmin = true;
                }
            }
            controller.set('isAdmin', isAdmin);
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
        }.observes('team_permissions')
    }
});

App.ContactController = Ember.ObjectController.extend({
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


App.EventController = Ember.ObjectController.extend({
    registration_date: moment().format('YYYY-MM-DD'),
    status_options: [{name:'Attended', selected: true},
                     {name:'Signed-In', selected:false},
                     {name:'Signed-Out', selected:false}],
    status: 'Attended',

    actions: {
        setStatus: function(status) {
            var options = []
            var controller = this;
            controller.set('status', status.name);
            controller.get('status_options').forEach(function(st) {
                if (controller.get('status') == st.name) {
                    st.selected = true;
                    options.push(st);
                } else {
                    st.selected = false;
                    options.push(st);
                }
            });
            controller.set('status_options', options);
        }
    }
});
