require({
	// Path mappings for module names not found directly under baseUrl
	paths: {
		  'jquery': 'vendor/jquery/jquery'
		, 'jqm': 'vendor/jquery/jquery.mobile.custom'
		, 'underscore': 'vendor/underscore/underscore_amd'
		, 'backbone': 'vendor/backbone/backbone_amd'
		, 'localStorage': 'vendor/backbone/backbone.localStorage'
		, 'backboneSync': 'vendor/backbone/backbone.sync'
		, 'text': 'vendor/require/text'
		, 'handlebars': 'vendor/handlebars/handlebars'
		, 'models': 'models'
		, 'views': 'views'
		, 'collections': 'collections'
		, 'templates': 'templates'
		, 'widgets': 'widgets'
		, 'helpers': 'templates/helpers/helpers'
	}
});

define(['jquery', 'bootstrap'], function ( $, Bootstrap ) {

	$(function () {
		
		'use strict';

		// Initialize **Bootstrap**
		new Bootstrap.initialize();

		$('#main-page').css('min-height', $(window).height());

		$(document).on('click', '.menu-toggle', function(){

			toggleMenu();

			return false;

		});

		App.Dispatcher.on('menu:close:request', function () {

			hideMenu();

		});

		function toggleMenu() {

			var menu = $('.menu');

			if ( menu.is('.open') ) {

				hideMenu();

			} else {

				showMenu();

			}

		};

		function showMenu() {

			var menu = $('.menu');

			menu.toggleClass('open');

			$('#main-page').animate({
				left: 290,
			}, 250, function() {
				App.Dispatcher.trigger('menu:open');
			});

		};

		function hideMenu() {

			var menu = $('.menu');

			$('#main-page').animate({
				left: 0,
			}, 250, function() {
				menu.toggleClass('open');
				App.Dispatcher.trigger('menu:close:complete');
			});

		};
	
	});
	
});