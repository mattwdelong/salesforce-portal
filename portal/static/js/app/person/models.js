var DATE_FORMAT = 'DD/MM/YYYY';

// Ajax wrapper that returns a promise
function ajax (url, options) {
  return new Ember.RSVP.Promise(function (resolve, reject) {
    options = options || {};
    options.url = url;

    Ember.$.ajax(options).done(function (data) {
        console.log(data);
        if (data.response == 'Success') {
            resolve(data);
        } else {
            // Return error for validation errors
            reject(new Error(data.message));
        }
    }).fail(function (jqxhr, status, something) {
        reject(new Error("AJAX: `" + url + "` failed with status: [" + status + "] " + something));
    });
  });
}


Ember.Handlebars.registerBoundHelper('formatDate', function(date) {
    if (date) {
        return moment(date, 'YYYY-MM-DD').format(DATE_FORMAT);
    } else {
        return '';
    }
});


Ember.Handlebars.registerBoundHelper('formatNotes', function(notes) {
    if (notes) {
        return notes.replace('\n', '\n ').split('\n');
    } else {
        return [''];
    }
});


Ember.Handlebars.registerBoundHelper('formatPicklist', function(notes) {
    if (notes) {
        return notes.replace(';', '; ');
    } else {
        return '';
    }
});


Ember.Handlebars.registerBoundHelper('emailList', function(members) {
    return members.map(function(item) {
        return item.Name + " <" + item.Email + ">";
    }).join(", ");
});


// Date picker widget for view
App.CalendarDatePicker = Ember.TextField.extend({
    _picker: null,

    modelChangedValue: function(){
        var picker = this.get("_picker");
        if (picker){
            picker.setDate(this.get("value"));
        }
    }.observes("value"),

    didInsertElement: function(){
        var currentYear = (new Date()).getFullYear();
        var formElement = this.$()[0];
        var picker = new Pikaday({
            field: formElement,
            yearRange: [1900,currentYear+2],
            format: 'YYYY-MM-DD'
        });
        this.set("_picker", picker);
    },

    willDestroyElement: function(){
        var picker = this.get("_picker");
        if (picker) {
            picker.destroy();
        }
        this.set("_picker", null);
    }
});


App.Person = Ember.Object.extend({});

App.Person.reopenClass({
    url: '/api/people',

    getAll: function (pageNo) {
        var url = this.url;
        if (pageNo) {
            url = this.url + '/page/' + pageNo;
        }
        return ajax(url, {
            type: 'GET',
            contentType: "application/json; charset=utf-8"
        });
    },

    find: function(data) {
        return ajax(this.url + '/find', {
            type: 'POST',
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    findById: function(modelId) {
        if ((!modelId) || (modelId === 'undefined')) {
            modelId = 'me';
        }
        return ajax(this.url + '/' + modelId, {
            type: 'GET',
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    updateTeam: function(contactId, teamId) {
        return ajax(this.url + '/' + contactId + '/team/' + teamId, {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    updateCoreTeam: function(contactId, teamId) {
        return ajax(this.url + '/' + contactId + '/core_team/' + teamId, {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    updateTeamPermissions: function(contactId, teamId) {
        return ajax(this.url + '/' + contactId + '/team_permissions/' + teamId, {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    updateSmallGroup: function(contactId, groupId) {
        return ajax(this.url + '/' + contactId + '/small_group/' + groupId, {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    toggleCheckbox: function(contactId, field) {
        return ajax(this.url + '/' + contactId + '/toggle', {
            type: 'POST',
            data: JSON.stringify({field: field}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    permissions: function() {
        return ajax('/api/permissions', {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    }

});


App.Contact = Ember.Object.extend({});

App.Contact.reopenClass({
    url: '/api/contact',

    all: function() {
        return ajax(this.url, {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    teams: function() {
        return ajax(this.url + '/teams', {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    team_members: function(selectedTeamIds, selectedGroupIds) {
        return ajax(this.url + '/teams/selected', {
            type: 'POST',
            data: JSON.stringify({
                selected_teams: selectedTeamIds,
                selected_small_groups: selectedGroupIds
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    }

});


App.Event = Ember.Object.extend({});

App.Event.reopenClass({
    url: '/api/event',

    all: function() {
        return ajax(this.url, {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    findById: function(modelId, registration_date) {
        if (!registration_date) {
            var d = new Date();
            registration_date = d.toJSON().slice(0, 10);
        }
        return ajax(this.url + '/' + modelId + '/' + registration_date, {
            type: 'GET',
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    findPerson: function(modelId, registration_date, type, find_name) {
        return ajax(this.url + '/' + modelId + '/' + registration_date + '/find_person', {
            type: 'POST',
            data: JSON.stringify({
                find_name: find_name,
                type: type
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    signIn: function(registrationId) {
        return ajax(this.url + '/registration/' + registrationId, {
            type: 'POST',
            data: JSON.stringify({
                action: 'Signed-In'
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    signOut: function(registrationId) {
        return ajax(this.url + '/registration/' + registrationId, {
            type: 'POST',
            data: JSON.stringify({
                action: 'Signed-Out'
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    },

    remove: function(registrationId) {
        return ajax(this.url + '/registration/' + registrationId, {
            type: 'POST',
            data: JSON.stringify({
                action: 'Delete'
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    }
});
