App.PeopleController = Ember.ArrayController.extend({
    actions: {
        findPeople: function () {
            var data = {
                name: this.get('find_name')
            };

            var controller = this;
            App.Person.find(data).then(function(data) {
                var results = data.results;
                controller.get('content').setObjects(results.records);
            }).catch(function(error) {
                controller.set('error', error.message);
            });
        },

        clearFind: function() {
            this.set('find_name', null);
            this.transitionToRoute('index');
        }
    }
});


App.PersonController = Ember.ObjectController.extend({

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
        }.observes('team_serving')
    }
});
