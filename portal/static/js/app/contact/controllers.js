App.ContactController = Ember.ObjectController.extend({
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
