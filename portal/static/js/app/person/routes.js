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
            console.log(data.data);
            return data.data;
        });
    },

    setupController: function(controller, model) {
        console.log("Setup ContactRoute");
        controller.set('content', model);
        //controller.getPermissions();

    }

});
