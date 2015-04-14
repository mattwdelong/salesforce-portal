App.EventController = Ember.ObjectController.extend({
    loading: false,
    registration_date: moment().format('YYYY-MM-DD'),
    searchResultsComplete: [],
    searchResults: [],
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
        console.log('reset');
        this.set('status', null);
        this.set('status', 'ALL');
        this.set('filteredCount', this.get('registrations').length);
    }.observes('registrations'),

    getPermissions: function() {
        getPermissions(this);
    },

    getRegistrations: function() {
        console.log('getRegistrations');
        var controller = this;
        controller.set('loading', true);
        App.Event.findById(controller.get("model").Id, controller.get("registration_date")).then(function(data) {
            controller.set('model', data.data);
            controller.set('registrations', data.data.registrations);
            controller.set('loading', false);
        });
    }.observes("registration_date"),

    findPeople: function() {
        console.log('findPeople');
        // Get all the people
        var name = '';
        var controller = this;
        controller.set('loading', true);
        App.Event.findPerson(controller.get("model").Id, controller.get("registration_date"),
            controller.get("model").Type__c, name).then(function(data) {
                controller.set('searchResultsComplete', data.data.records);
                controller.set('searchResults', data.data.records);
                controller.set('loading', false);
        });
    },

    filter: function() {
        var status = this.get('status');
        var group;
        if (this.get('model.Type__c') == 'Kidswork') {
            group = this.get('kids');
        } else {
            group = this.get('type');
        }

        if ((status == 'ALL') && (group == 'ALL')) {
            this.set('filteredCount', this.get('registrations').length);
            this.set('searchResults', this.get('searchResultsComplete'));
            return this.get('registrations');
        }

        var filtered;
        var search = this.get('searchResultsComplete');

        // Filter the list based on the status
        if (status == 'ALL') {
            filtered = this.get('registrations');
        } else {
            var rx1 = new RegExp(status, 'gi');
            filtered = this.get('registrations').filter(function (r) {
                return r.Status.match(rx1);
            });
        }

        // Filter the list based on the group
        if (group != 'ALL') {
            var rx = new RegExp(group, 'gi');
            filtered = filtered.filter(function (r) {
                return r.Type.match(rx);
            });
            search = search.filter(function (r) {
                return r.Contact_Type__c.match(rx);
            });
        }

        this.set('filteredCount', filtered.length);
        this.set('searchResults', search);
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
        },

        signInNew: function(person) {
            var controller = this;

            var eventId = controller.get('model.Id');
            var registrationDate = controller.get('registration_date');
            var personId = person.Id;

            App.Event.signInNew(eventId, registrationDate, personId).then(function(data) {
                controller.set('registrations', data.registrations);

                // Remove the person from the search results
                controller.set('searchResults', controller.get('searchResults').without(person));
                controller.set('searchResultsComplete', controller.get('searchResultsComplete').without(person));
            });
        }.observes('registrations', 'searchResults', 'searchResultsComplete'),

        remove: function(r) {
            var controller = this;

            App.Event.remove(r.Id).then(function(data) {
                controller.set('registrations', data.registrations);
            });
        }.observes('registrations')
    }
});


App.EventKidsworkController = Ember.ObjectController.extend({
    loading: false,
    registration_date: moment().format('YYYY-MM-DD'),
    searchResults: [],
    personInfo: {},

    getPermissions: function() {
        getPermissions(this);
    },

    getRegistrations: function() {
        var controller = this;
        controller.set('loading', true);
        App.Event.findById(controller.get("model").Id, controller.get("registration_date")).then(function(data) {
            controller.set('model', data.data);
            controller.set('registrations', data.data.registrations);
            controller.set('loading', false);
        });
    }.observes("registration_date"),

    totalPrimary: function() {
        return this.get('model.registrations').filterBy('isPrimary', true).length;
    }.property('registrations'),

    totalPreschool: function() {
        return this.get('model.registrations').filterBy('isPreschool', true).length;
    }.property('registrations'),

    findPeople: function() {
        // Only perform the search if a name is entered
        var name = this.get('find_name');
        if (name) {
            name = name.replace(/^\s+|\s+$/g,'');
            if (name.length === 0) {
                return;
            }
        } else {
            return;
        }

        var controller = this;
        controller.set('loading', true);
        App.Event.findPerson(controller.get("model").Id, controller.get("registration_date"),
            controller.get("model").Type__c, name).then(function(data) {
                controller.set('searchResults', data.data.records);
                controller.set('loading', false);
        });
    },

    actions: {
        findPeople: function() {
            this.findPeople();
        },

        showPerson: function(personId) {
            var controller = this;

            // Get the person's details
            App.Person.findById(personId).then(function(data) {
                controller.set('personInfo', data.person);

                // Show the person details dialog
                Ember.$('#personInfoModal').modal('show');
            });
        },

        clearSearch: function() {
            this.set('searchResults', []);
            this.set('find_name', null);
        },

        signInNew: function(person) {
            var controller = this;

            var eventId = controller.get('model.Id');
            var registrationDate = controller.get('registration_date');
            var personId = person.Id;

            App.Event.signInNew(eventId, registrationDate, personId).then(function(data) {
                controller.set('registrations', data.registrations);
            });
        }.observes('registrations'),

        signIn: function(r) {
            var controller = this;

            App.Event.signIn(r.Id).then(function(data) {
                controller.set('registrations', data.registrations);
            });
        }.observes('registrations'),

        signOut: function(r) {
            var controller = this;

            App.Event.signOut(r.Id).then(function(data) {
                controller.set('registrations', data.registrations);
            });
        }.observes('registrations'),

        remove: function(r) {
            var controller = this;

            App.Event.remove(r.Id).then(function(data) {
                controller.set('registrations', data.registrations);
            });
        }.observes('registrations')
    }
});
