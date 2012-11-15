define([
	'jquery'
	, 'underscore'
	, 'backbone'
	, 'handlebars'
	, 'widgets/textinput'
	, 'text!templates/profileTemplate.html'
],
function ( $, _, Backbone, Handlebars, TextInput, ProfileTemplate ) {

	'use strict';

	App.ProfileView = Backbone.View.extend({
	
		template: Handlebars.compile( ProfileTemplate ),
		
		initialize: function () {

			this.model.on( 'change', this.render, this );
		
		},

		render: function () {

			// Render
			this.$el.html( this.template( this.model.toJSON() ) );

			// Sync Init
			this.syncInit();

			return this;

		},
		
		close: function () {
		
			this.remove();
			this.unbind();
			this.model.off( 'change', this.render, this );
	
			this.$el = null;
			this.el = null;
		
		}
		
	});

	return App.ProfileView;

});