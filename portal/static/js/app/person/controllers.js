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
