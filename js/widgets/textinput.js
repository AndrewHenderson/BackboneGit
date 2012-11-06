define(['jquery', 'jqm', 'widgets/placeholder'], function ( $, $mobile, Placeholder ) {

	'use strict';

	$.widget('custom.textinput', {

		_create: function () {

			if ( this.element.attr('placeholder') !== 'undefined' ) {

				this.element.placeholder();

			}

			this._on( this.element, {

				'focus': '_focusOn',
				'blur': '_focusOff'

			});

		},

		_focusOn: function () {

			this.element.addClass('focused');

		},

		_focusOff: function () {

			this.element.removeClass('focused');

		}

	});

});