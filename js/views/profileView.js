define(['jquery', 'underscore', 'backbone', 'handlebars', 'widgets/textinput', 'text!templates/profileTemplate.html'],
function ( $, _, Backbone, Handlebars, TextInput, ProfileTemplate ) {

	'use strict';

	App.ProfileView = Backbone.View.extend({
	
		template: Handlebars.compile( ProfileTemplate ),
		
		initialize: function () {

			this.model.on( 'change', this.render, this );

			this.storeLocalCopy( this.model );
		
		},

		storeLocalCopy: function ( latestCheckout ) {

			// Create a local branch of the latest checkout

			var latestCheckout = JSON.stringify( latestCheckout );

			localStorage.setItem( 'local-branch', latestCheckout );

		},

		events: {

			'click .save': 'packageObj',
			'click .cancel': 'cancel',
			'click .mine': 'takeMine',
			'click .theirs': 'takeTheirs'

		},
		
		render: function () {

			console.log('render...');
		
			this.$el.html( this.template( this.model.toJSON() ) );

			// variables
			this.$first = this.$('#first');
			this.$last = this.$('#last');
			this.$city = this.$('#city');
			this.$state = this.$('#state');
			this.$bio = this.$('#bio');

			this.$firstVal = this.$('#first').val().trim(); // Storing data for Cancel Event
			this.$lastVal = this.$('#last').val().trim(); // Storing data for Cancel Event
			this.$cityVal = this.$('#city').val().trim(); // Storing data for Cancel Event
			this.$stateVal = this.$('#state').val().trim(); // Storing data for Cancel Event
			this.$bioVal = this.$('#bio').val().trim(); // Storing data for Cancel Event

			// this.$el.find('input, textarea').textinput(); // jQuery Mobile Custom Widget
			
			return this;
		
		},

		newAttributes: function() {

			return {

				first: this.$first.val().trim(),
				last: this.$last.val().trim(),
				city: this.$city.val().trim(),
				state: this.$state.val().trim(),
				bio: this.$bio.val().trim()

			}

		},

		packageObj: function ( event, obj ) {

			console.log('packaging new object...');

			var self = this,
				obj = obj || {},
				localBranch = $.parseJSON( localStorage.getItem('local-branch') ),
				newAttributes = this.newAttributes();
			obj.passphrase = localBranch;

			$.each(newAttributes, function ( key, value ) {

				if ( newAttributes[key] !== self.model.get(key) ) {
					
					obj[key] = newAttributes[key];

				}

			});

			this.compareObj(obj);

		},

		compareObj: function ( objFromClient ) {

			// console.log('Comparing: ', obj.lastSync, 'with ', this.objOnServer );

			var self = this,
				serverAttr = {},
				passAttr = {};

			$.each( objFromClient.passphrase, function ( key, value ) {

				if ( objFromClient[key] !== self.objOnServer[key] && objFromClient.passphrase[key] !== self.objOnServer[key] ) {

					serverAttr[key] = self.objOnServer[key];
					passAttr[key] = objFromClient.passphrase[key];

				}

			});

			if ( !_.isEqual( passAttr, serverAttr ) ) {

				console.log("doesn't match server copy");

				this.serverResponse(false, serverAttr);

			} else {

				console.log("matches server copy");

				this.serverResponse(true);

			}

		},

		serverResponse: function ( response, serverAttr ) {

			console.log('ServerAttr: ', serverAttr);

			if ( response === false ) {

				// Failed submission

				var localCopy = $.parseJSON( localStorage.getItem('local-branch') ),
					objOnServer = this.objOnServer,
					newAttributes = this.newAttributes();

				$.each(serverAttr, function ( key, value ) {

					var valueOnServer = serverAttr[ key ],
						valueOnLocal = localCopy[ key ],
						valueEntered = newAttributes[ key ],
						selector = $('#' + key);
					
					if ( value !== valueOnLocal && value !== valueEntered ) {

						console.log('mismatch: ', 'server: ', value, ' local: ', valueOnLocal, ' entered: ', valueEntered );

						objOnServer[key] = value;

						selector.addClass('error').after('<span class="error-label mine" data-value="' + valueOnServer + '">Theirs: ' + valueOnServer + '</span>').after('<span class="error-label mine" data-value="' + valueEntered + '">Mine: ' + valueEntered + '</span>');
						$('div.error').show();
						$('.save').attr('disabled', 'disabled').text('Submit');
					
					}

				});

				this.$el.find('input, textarea').attr('disabled', 'disabled');

				this.storeLocalCopy( objOnServer );
				this.objOnServer = objOnServer;
				localStorage.setItem('previous-branch', JSON.stringify( localCopy ) )

			} else {

				// Successful submission

				this.removeErrors();

				if ( !_.isEqual(this.model, this.newAttributes() ) ) {

					this.model.set( this.newAttributes() );

				} else {

					this.render();

				}

				if ( localStorage.getItem('previous-branch') ) {

					localStorage.removeItem('previous-branch');

				}

				this.objOnServer = this.newAttributes();
				this.storeLocalCopy( this.objOnServer );

				this.$el.find('input, textarea').removeAttr('disabled');

			}

		},

		takeMine: function ( event ) {

			var $target = $(event.currentTarget);

			var value = $target.attr('data-value');

			$target.siblings('input, textarea').val(value).removeClass('error');
			$target.siblings('.error-label').remove();
			$target.remove();

			this.checkErrors();

		},

		takeTheirs: function ( event ) {

			var $target = $(event.currentTarget);

			var value = $target.attr('data-value');

			$target.siblings('input, textarea').val(value).removeClass('error');
			$target.siblings('.error-label').remove();
			$target.remove();

			this.checkErrors();

		},


		cancel: function () {

			var previousBranch = localStorage.getItem('previous-branch');
			
			if ( typeof previousBranch === 'string' ) {

				localStorage.setItem('local-branch', previousBranch );
				localStorage.removeItem('previous-branch');

			}

			$('.save').attr('disabled', 'disabled').text('Save');

			this.removeErrors();
			this.enableSubmit();

			return false;

		},

		checkErrors: function () {

			var numErrors = this.$el.find('.error-label').length;

			if ( numErrors < 1 ) {

				$('div.error').hide();
				$('.success').show();

				this.enableSubmit();

			}

		},

		removeErrors: function () {

			this.$el.find('input.error, textarea.erorr').removeClass('error');
			$('div.error, div.success').hide();
			this.$el.find('.error-label').remove();
			$('input, textarea').removeAttr('disabled');

		},

		disableSubmit: function () {

			$('.save').attr('disabled', 'disabled');

		},

		enableSubmit: function () {

			$('.save').removeAttr('disabled');

		},

		restoreDefaults: function () {

			this.$first.val(this.$firstVal);
			this.$last.val(this.$lastVal);
			this.$city.val(this.$cityVal);
			this.$state.val(this.$stateVal);
			this.$bio.val(this.$bioVal);

		},
		
		close: function () {
		
			this.remove();
			this.unbind();
			this.model.off( 'change', this.render, this );
	
			this.$el = null;
			this.el = null;
		
		},

		objOnServer: {
			first: 'Steve',
			last: 'Evans',
			city: 'Los Angeles',
			state: 'California',
			bio: 'Sartorial vegan fixie enim wayfarers. Cardigan officia bicycle rights, beard thundercats small batch mustache salvia cosby sweater enim. American apparel tattooed culpa, duis craft beer vero food truck fingerstache shoreditch ethical gastropub squid seitan. Hoodie high life +1 nulla, cupidatat kogi proident wolf sunt wayfarers irure. Sartorial eu dolor, deserunt before they sold out organic forage master cleanse. Scenester nesciunt iphone delectus blog skateboard. Vice kale chips minim pinterest bespoke.'
		},
		
	});

	return App.ProfileView;

});