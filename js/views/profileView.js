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

			var obj = obj || {};
			var newAttributes = this.newAttributes();

			if ( newAttributes.first !== this.model.get('first') ) {
				obj.first = newAttributes.first;
			}

			if ( newAttributes.last !== this.model.get('last') ) {
				obj.last = newAttributes.last;
			}

			if ( newAttributes.city !== this.model.get('city') ) {
				obj.city = newAttributes.city;
			}

			if ( newAttributes.state !== this.model.get('state') ) {
				obj.state = newAttributes.state;
			}

			if ( newAttributes.bio !== this.model.get('bio') ) {
				obj.bio = newAttributes.bio;
			}

			obj.lastSync = $.parseJSON( localStorage.getItem('local-branch') );

			this.sendObj(obj);

		},

		objOnServer: {
			first: 'Steve',
			last: 'Evans',
			city: 'Los Angeles',
			state: 'California',
			bio: 'Sartorial vegan fixie enim wayfarers. Cardigan officia bicycle rights, beard thundercats small batch mustache salvia cosby sweater enim. American apparel tattooed culpa, duis craft beer vero food truck fingerstache shoreditch ethical gastropub squid seitan. Hoodie high life +1 nulla, cupidatat kogi proident wolf sunt wayfarers irure. Sartorial eu dolor, deserunt before they sold out organic forage master cleanse. Scenester nesciunt iphone delectus blog skateboard. Vice kale chips minim pinterest bespoke.'
		},

		sendObj: function ( objFromClient ) {

			// console.log('Comparing: ', obj.lastSync, 'with ', this.objOnServer );

			if ( !_.isEqual( objFromClient.lastSync, this.objOnServer ) ) {

				console.log("doesn't match server copy");

				this.serverResponse(false, this.objOnServer);

			} else {

				console.log("matches server copy");

				this.serverResponse(true);

			}

		},

		serverResponse: function ( response, objOnServer ) {

			if ( response === false ) {

				// Failed submission

				var localCopy = $.parseJSON( localStorage.getItem('local-branch') ),
					newAttributes = this.newAttributes();

				$.each(localCopy, function ( key, value ) {

					var valueOnServer = objOnServer[key],
						valueEntered = newAttributes[ key ],
						selector = $('#' + key);
					
					if ( value !== valueOnServer && valueEntered !== valueOnServer ) {

						console.log('mismatch: ', value, valueOnServer );

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
			
			localStorage.setItem('local-branch', previousBranch );
			localStorage.removeItem('previous-branch');

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
		
		}
		
	});

	return App.ProfileView;

});