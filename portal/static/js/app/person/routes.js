function getPermissions(controller) {
    App.Person.permissions().then(function(result) {
        controller.set('permissions', result.permissions);

        var isStandard = true;
        var isAdmin = false;
        var isLeader = false;
        var isEvents = false;
        var isStandardEvents = false;
        if (controller.get("permissions")) {
            if (controller.get("permissions").role=="Admin") {
                isAdmin = true;
                isLeader = true;
                isStandard = false;
            } else if (controller.get("permissions").role=="Leader") {
                isLeader = true;
                isStandard = false;
            } else if (controller.get("permissions").role=="Standard+Events") {
                isLeader = false;
                isStandard = true;
                isStandardEvents = true;
            } else if (controller.get("permissions").role=="Events") {
                isEvents = true;
                isStandard = false;
            }
        }
        var isContactAllowed = (isStandard || isLeader || isAdmin || isStandardEvents);

        controller.set('isAdmin', isAdmin);
        controller.set('isLeader', isLeader);
        controller.set('isStandard', isStandard);
        controller.set('isEvents', isEvents);
        controller.set('isStandardEvents', isStandardEvents);
        controller.set('isContactAllowed', isContactAllowed);

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
        getPermissions(controller);
        controller.set('content', model);


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
        getPermissions(controller);
        controller.set('content', model);
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
