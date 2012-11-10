define([
	  'jquery'
	, 'jqm'
	, 'underscore'
	, 'backbone'
	, 'models/profileModel'
	, 'views/profileView'
	, 'models/inputModel'
	, 'views/inputView'
	, 'views/aboutView'
	, 'text!templates/homeTemplate.html'
	, 'widgets/listview'
],
function ( $, $mobile, _, Backbone, ProfileModel, ProfileView, InputModel, InputView, AboutView, HomeTemplate, ListView ) {

	_.extend(App.Dispatcher, Backbone.Events);

	App.Router = Backbone.Router.extend({

		initialize: function () {



		},

		routes: {
			 '': 'showHome',
			 'about/': 'about',
			 '*actions': 'defaultAction' // default action,mapping "/#anything"       	
        },

	    defaultAction: function ( actions ) {

	    	this.showHome();

	    },

	    showHome: function () {

			var model = new ProfileModel();

			var view = new ProfileView({

				model: model

			});

			var model2 = new InputModel();

			var view2 = new InputView({

				model: model2

			});

			$('#main-page').append( view.render().el, view2.render().el );

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
