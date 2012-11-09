define([
	  'backbone'
	, 'namespace'
	, 'router'
	, 'backboneGit'
],
function ( Backbone, Namespace, Router ) {

	'use strict';

	var init = function () {
		
		// Create Backbone Router
		var router = new App.Router();
		Backbone.history.start();
		
	};

	return {
		initialize: init
	};

});