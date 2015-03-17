App = Ember.Application.create({
    LOG_TRANSITIONS: true
});

// Router

App.Router.map(function() {
    this.resource('index', { path: '/' });
    this.resource('people', { path: '/people' });
    this.resource('person', { path: '/person/:Id' });
    this.resource('contact', { path: '/contact'});
    this.resource('events', { path: '/events'});
    this.resource('event_kidswork', { path: '/event/:Id/kidswork' });
    this.resource('event', { path: '/event/:Id' });
});

