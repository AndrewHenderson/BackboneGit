define(['jquery', 'underscore', 'backbone', 'handlebars', 'widgets/textinput', 'text!templates/profileTemplate.html'],
function ( $, _, Backbone, Handlebars, TextInput, ProfileTemplate ) {

	'use strict';

	App.ProfileView = Backbone.View.extend({

		className: 'profile-form',
	
		template: Handlebars.compile( ProfileTemplate ),
		
		initialize: function () {

			this.model.on( 'change', this.render, this );

			this.storeLocalCopy();
		
		},

		storeLocalCopy: function ( latestFromServer ) {

			// Creates a local branch of the latest object from server

			if ( typeof latestFromServer !== 'undefined' ) {

				localStorage.setItem( 'local-branch', JSON.stringify( latestFromServer ) );

			} else {

				localStorage.setItem( 'local-branch', JSON.stringify( this.model ) );

			}

		},

		events: {

			'vclick .save': 'packageObj',
			'vclick .cancel': 'cancel',
			'vclick .mine': 'submitMine',
			'vclick .theirs': 'submitTheirs'

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

			this.compareOnServer(obj);

		},

		objOnServer: {
			first: 'Steve',
			last: 'Evans',
			city: 'Los Angeles',
			state: 'California',
			bio: 'Sartorial vegan fixie enim wayfarers. Cardigan officia bicycle rights, beard thundercats small batch mustache salvia cosby sweater enim. American apparel tattooed culpa, duis craft beer vero food truck fingerstache shoreditch ethical gastropub squid seitan. Hoodie high life +1 nulla, cupidatat kogi proident wolf sunt wayfarers irure. Sartorial eu dolor, deserunt before they sold out organic forage master cleanse. Scenester nesciunt iphone delectus blog skateboard. Vice kale chips minim pinterest bespoke.'
		},

		compareOnServer: function ( obj ) {

			// console.log('Comparing: ', obj.lastSync, 'with ', this.objOnServer );

			if ( !_.isEqual( obj.lastSync, this.objOnServer ) ) {

				console.log("Doesn't match server copy");

				this.serverResponse(false, this.objOnServer);

			} else {

				console.log("Matches server copy");

				this.serverResponse(true);

			}

		},

		serverResponse: function ( response, objFromServer ) {

			if ( response === false ) {

				var localCopy = $.parseJSON( localStorage.getItem('local-branch') ),
					newLocalCopy = localCopy,
					mergedLocalCopy = this.newAttributes();

				$.each(localCopy, function ( key, value ) {

					var valServerSide = objFromServer[key],
						selector = $('#' + key);
					
					if ( value !== valServerSide ) {

						console.log('mismatch: ', value, valServerSide );

						newLocalCopy[key] = valServerSide;
						mergedLocalCopy[key] = valServerSide;

						selector.addClass('error').after('<span class="error-label">Theirs: ' + valServerSide + '</span>');
						$('div.error').show();
						$('.save').attr('disabled', 'disabled').find('.ui-btn-text').text('Submit');
					
					}

				});

				this.$el.find('input, textarea').attr('disabled', 'disabled');

				this.storeLocalCopy( newLocalCopy );
				this.objOnServer = newLocalCopy;
				localStorage.setItem('merged-branch', JSON.stringify( mergedLocalCopy ) )

			} else {

				console.log('success');

				this.removeErrors();

				if ( !_.isEqual(this.model, this.newAttributes() ) ) {

					this.model.set( this.newAttributes() );

				} else {

					this.render();

				}

				if ( localStorage.getItem('merged-branch') ) {

					localStorage.removeItem('merged-branch');

				}

				this.objOnServer = this.newAttributes();
				this.storeLocalCopy( this.newAttributes() );

				this.$el.find('input, textarea').removeAttr('disabled');

			}

		},

		submitMine: function ( event ) {

			this.packageObj( event );

		},

		submitTheirs: function ( event ) {

			$('.error-label').remove();
			
			var mergedBranch = $.parseJSON( localStorage.getItem('merged-branch') )
			
			this.model.set( mergedBranch );

			this.packageObj( event );

			localStorage.removeItem('merged-branch');

		},

		cancel: function () {

			this.render();

			return false;

		},

		removeErrors: function () {

			this.$el.find('input.error, textarea.erorr').removeClass('error');
			$('div.error').hide();
			this.$el.find('.error-label').remove();

		},

		restoreDefaults: function () {

			this.$first.val(this.$firstVal);
			this.$last.val(this.$lastVal);
			this.$city.val(this.$cityVal);
			this.$state.val(this.$stateVal);
			this.$bio.val(this.$bioVal);

		},

		getUpdate: function () {

			console.log('remote change...');

			var updatedModel = this.model.clone();

			// Fake database change
			updatedModel.set({ first: 'Tony', last: 'LeVoci' });

			localStorage.setItem('local-branch', JSON.stringify(updatedModel) );

			this.compare();

			return false;

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