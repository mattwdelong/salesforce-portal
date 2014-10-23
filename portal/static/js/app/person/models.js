
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

    updateSmallGroup: function(contactId, groupId) {
        return ajax(this.url + '/' + contactId + '/small_group/' + groupId, {
            type: 'POST',
            data: JSON.stringify({}),
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

    team_members: function(teamId) {
        return ajax(this.url + '/teams/' + teamId, {
            type: 'POST',
            data: JSON.stringify({}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
    }

});
