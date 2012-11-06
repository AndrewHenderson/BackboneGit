define(['jquery', 'jqm'], function ( $ ) {

	'use strict';

	$.widget('custom.listview', {

		_create: function () {

			this._on( this.element, {

				'vmousedown li': '_hoverOn',
				'vmouseup li': '_hoverOff',
				'vmouseover li': '_hoverOn',
				'vmouseout li': '_hoverOff'

			});

		},

		_hoverOn: function ( e ) {

			var $self = $(e.target);

			$self.closest('li').addClass('hover');

		},

		_hoverOff: function ( e ) {

			var $self = $(e.target);

			$self.closest('li').removeClass('hover');

		}

	});

});