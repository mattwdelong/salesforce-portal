App.IndexRoute = Ember.Route.extend({
  beforeModel: function() {
    this.transitionTo('people');
  }
});

App.PeopleRoute = Ember.Route.extend({
    model: function(params) {
        return [];
//        var pageNo = null;
//        if (params.page_no) {
//            pageNo = params.page_no;
//        }
//
//
//        return App.Person.getAll(pageNo).then(function(data) {
//            // This is a paginated result
//            var results = data.results;
//            return results.records;
//        });
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
    }
});
