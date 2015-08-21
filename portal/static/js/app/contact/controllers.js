App.ContactController = Ember.ObjectController.extend({
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
        //var selectedTeamIds = [];
        //var selectedGroupIds = [];
        //var selectedCategories = [];

        // Sort the teams/groups/categories lists by name
        var sortedTeams = controller.get("teamsSelected").sortBy('Name');
        var sortedTeamsUnsel = controller.get("teamsUnselected").sortBy('Name');
        var sortedGroups = controller.get("smallGroupsSelected").sortBy('Name');
        var sortedGroupsUnsel = controller.get("smallGroupsUnselected").sortBy('Name');
        var sortedCategories = controller.get("categoriesSelected").sortBy('name');
        var sortedCategoriesUnsel = controller.get("categoriesUnselected").sortBy('name');
        controller.set("teamsSelected", sortedTeams);
        controller.set("teamsUnselected", sortedTeamsUnsel);
        controller.set("smallGroupsSelected", sortedGroups);
        controller.set("smallGroupsUnselected", sortedGroupsUnsel);
        controller.set("categoriesSelected", sortedCategories);
        controller.set("categoriesUnselected", sortedCategoriesUnsel);

        // Fetch the members of the selected team and add to member list
        App.Contact.team_members(sortedTeams, sortedGroups, sortedCategories).then(function (data) {
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
