define(['backbone'], function ( Backbone ) {

	'use strict';

	App.InputModel = Backbone.Model.extend({

		'defaults': {

			people: '1',
			currency: 'USD',
			price: '0',
			per: '0',
			timestamp: 'Mon Nov 12 2012 11:30:00 GMT-0800 (Pacific Standard Time)'
			
		}
	
	});

	return App.InputModel;

});