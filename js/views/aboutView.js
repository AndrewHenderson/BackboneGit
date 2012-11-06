define(['backbone', 'handlebars', 'text!templates/aboutTemplate.html'],
function ( Backbone, Handlebars, AboutTemplate ) {

	'use strict';

	App.AboutView = Backbone.View.extend({

		template: Handlebars.compile(AboutTemplate),
		
		initialize: function () {
		
		},

		events: {
			
		},
		
		render: function () {
		
			this.$el.html( this.template() );
			
			return this;
		
		},
		
		close: function () {
		
			this.remove();
			this.unbind();
	
			this.$el = null;
			this.el = null;
		
		}
		
	});

	return App.AboutView;

});