
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
