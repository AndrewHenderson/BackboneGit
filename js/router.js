define([
	  'jquery'
	, 'jqm'
	, 'underscore'
	, 'backbone'
	, 'models/profileModel'
	, 'views/profileView'
	, 'views/aboutView'
	, 'text!templates/homeTemplate.html'
	, 'widgets/listview'
],
function ( $, $mobile, _, Backbone, ProfileModel, ProfileView, AboutView, HomeTemplate, ListView ) {

	_.extend(App.Dispatcher, Backbone.Events);

	App.Router = Backbone.Router.extend({

		initialize: function () {



		},

		routes: {
			 '': 'contact',
			 'home/': 'contact',
			 'about/': 'about',
			 'contact/': 'contact',
			 '*actions': 'defaultAction' // default action,mapping "/#anything"       	
        },

	    defaultAction: function ( actions ) {

	    	this.showHome();

	    },

	    showHome: function () {

	    	/*var div = document.createElement('div');
	    	var html = $(div).html(HomeTemplate);

			this.prepPage({
				render: function () {
					return this;
				},
				el: html[0]
			});*/

			// $('#main-page').append(HomeTemplate);

	    },

		contact: function () {

			var model = new ProfileModel();

			var view = new ProfileView({

				model: model

			});

			this.prepPage(view);	

		},

		about: function () {

			var view = new AboutView();

			this.prepPage(view);	

		},

		prepPage: function ( page ) {

			App.Dispatcher.trigger('menu:close:request');
			this.changePage(page);

			$('#main-menu ul').listview();

		},

		changePage: function ( page ) {

			$('#main-page').empty().append(page.render().el);

			App.Dispatcher.on('menu:close:complete', function() {

				$('#main-page').empty().append(page.render().el);
				// $.mobile.changePage( page.$el, { changeHash: false } );
				App.Dispatcher.off('menu:close:complete');

			});

			$(document).trigger('pagechange');

		}

	});

	return App.Router;

});
