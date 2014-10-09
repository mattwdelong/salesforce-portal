App.rootElement = '#qunit';

App.setupForTesting();
App.injectTestHelpers();
App.isTesting = true;

module('Integration Tests', {
  teardown: function() {
    App.reset();
  }
});

test('Get the people list and expect list of names', function() {
  visit('/people');

  andThen(function() {
    equal(find('h2.sub-heading').text(), "People");
    notEqual(find('table tbody tr').length, 0);
  });
});
