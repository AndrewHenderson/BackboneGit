define([
	'jquery'
	, 'underscore'
	, 'backbone'
	, 'handlebars'
	, 'widgets/textinput'
	, 'text!templates/inputTemplate.html'
],
function ( $, _, Backbone, Handlebars, TextInput, InputTemplate ) {

	'use strict';

	App.InputView = Backbone.View.extend({
	
		template: Handlebars.compile( InputTemplate ),
		
		initialize: function () {

			this.model.on( 'change', this.render, this );
		
		},

		events: {

	    },

	    render: function () {

	    	// Render
       		this.$el.html( this.template( this.model.toJSON() ) );

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

	return App.InputView;

});