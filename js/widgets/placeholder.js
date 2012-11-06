define(['jquery', 'jqm'], function ( $ ) {

	'use strict';

	$.widget('custom.placeholder', {

		_create: function () {

			// Check for placeholder support
			$.support.placeholder = (function(){
				var i = document.createElement('input');
				return 'placeholder' in i;
			})();

			this.label = this.element.siblings('label');
			this.text = this.label.text();

			// Default functionality
			this._on( this.element, {

				'focus': 'validate',
				'vmouseover': 'mouseOver',
				'vmouseout': 'mouseOut',
				'keyup': 'validate',
				'blur': 'blur'

			});

			// Added functionalty when "placeholder" is not supported.
			if ( !$.support.placeholder ) {

				// Add class that styles the HTML label
				this.label.addClass('watermark');

				// Check input value on page load
				if ( this.element.val() !== '' ) {

					this.label.hide();

				}

				// Move focus from label to input when label is clicked.
				this._on( this.label, {

					'vclick': 'focusInput'

				});

			}

		},

		validate: function () {

			// Checks for user added value.
			if ( this.element.val() === '' ) {

				if ( !$.support.placeholder ) {

					this.label.fadeTo(500, 0.3);

				}

				this.removeTooltip();

			} else {

				if ( !$.support.placeholder ) {

					this.label.hide();

				}

				this.showTooltip();

			}

		},

		blur: function () {

			if ( !$.support.placeholder ) {

				if ( this.element.val() === '' ) {

					this.label.fadeTo(500, 1);

				} else {

					this.label.hide();

				}

			}

			this.removeTooltip();

		},

		mouseOver: function () {

			if ( !$.mobile.support.touch && this.element.val() !== '' ) {

				this.showTooltip();

			}

		},

		mouseOut: function () {

			if ( this.element.is(':focus') ) {

				// Persist tooltip when input is in focus.

			} else {

				this.removeTooltip();

			}

		},

		focusInput: function ( event ) {

			event.preventDefault(); // Prevent default behavior when clicking label.

			this.element.focus(); // Focus on the input field.

		},

		showTooltip: function () {

			if ( this.$tooltip ) {

				// Tooltip already instantiated.

			} else {

				this.$tooltip = $('<span class="tooltip">' + this.text + '</span>'); // Tooltip markup

				this.element.after(this.$tooltip); // Append tooltip after input.

				// Tooltip positioning
				var offset = this.element.offset(),
					left = offset.left,
					top = offset.top,
					width = this.element.outerWidth(),
					menuWidth = 0;

				if ( $('#main-menu').is('.open') ) {

					menuWidth = $('#main-menu').outerWidth();

				}	

				var	posX = left + width - menuWidth;

				this.$tooltip.css({
					'left': posX
				});

			}

			$('.tooltip').fadeIn(250);

		},

		removeTooltip: function () {

			if ( this.$tooltip ) {

				var self = this;

				this.$tooltip.fadeOut(250, function() {

					$(this).remove();

					self.$tooltip = null;

				});

			}

		}

	});

});