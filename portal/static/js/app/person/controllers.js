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
