App.EventController = Ember.ObjectController.extend({
    registration_date: moment().format('YYYY-MM-DD'),
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
        this.set('status', null);
        this.set('status', 'ALL');
        this.set('filteredCount', this.get('model').registrations.length);
    }.observes('model.registrations'),

    getRegistrations: function() {
        var controller = this;
        App.Event.findById(controller.get("model").Id, controller.get("registration_date")).then(function(data) {
            controller.set('model', data.data);
            controller.set('model.registrations', data.data.registrations);
        });
    }.observes("registration_date"),

    filter: function() {
        var status = this.get('status');
        var group;
        if (this.get('model.Type__c') == 'Kidswork') {
            group = this.get('kids');
        } else {
            group = this.get('type');
        }


        if ((status == 'ALL') && (group == 'ALL')) {
            this.set('filteredCount', this.get('model.registrations').length);
            return this.get('model.registrations');
        }

        var filtered;

        // Filter the list based on the status
        if (status == 'ALL') {
            filtered = this.get('model.registrations');
        } else {
            var rx = new RegExp(status, 'gi');
            filtered = this.get('model.registrations').filter(function (r) {
                return r.Status.match(rx);
            });
        }

        // Filter the list based on the group
        if (group != 'ALL') {
            var rx = new RegExp(group, 'gi');
            if (this.get('model.Type__c') == 'Kidswork') {
                filtered = filtered.filter(function (r) {
                    return r.KidsGroup.match(rx);
                });
            } else {
                filtered = filtered.filter(function (r) {
                    return r.Type.match(rx);
                });
            }
        }

        this.set('filteredCount', filtered.length);
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
        }
    }
});


App.EventKidsworkController = Ember.ObjectController.extend({
    registration_date: moment().format('YYYY-MM-DD'),
    searchResults: [],
    personInfo: {},

    getRegistrations: function() {
        var controller = this;
        App.Event.findById(controller.get("model").Id, controller.get("registration_date")).then(function(data) {
            controller.set('model', data.data);
            controller.set('registrations', data.data.registrations);
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
            if (name.length == 0) {
                return;
            }
        } else {
            return;
        }

        var controller = this;
        App.Event.findPerson(controller.get("model").Id, controller.get("registration_date"),
            controller.get("model").Type__c, name).then(function(data) {
                controller.set('searchResults', data.data.records);
        });
    },

    actions: {
        findPeople: function() {
            this.findPeople();
        },

        showPerson: function(r) {
            var controller = this;

            // Get the person's details
            App.Person.findById(r.PersonId).then(function(data) {
                controller.set('personInfo', data.person);

                // Show the person details dialog
                Ember.$('#personInfoModal').modal('show');
            });
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
