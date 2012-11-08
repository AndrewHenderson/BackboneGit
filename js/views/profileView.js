define([
	'jquery'
	, 'underscore'
	, 'backbone'
	, 'handlebars'
	, 'widgets/textinput'
	, 'text!templates/profileTemplate.html'
],
function ( $, _, Backbone, Handlebars, TextInput, ProfileTemplate ) {

	'use strict';

	App.ProfileView = Backbone.View.extend({
	
		template: Handlebars.compile( ProfileTemplate ),
		
		initialize: function () {

			this.model.on( 'change', this.render, this );
		
		},

		initDataSync: function () {

			// Construct dataSync Object
			this.dataSync = {};
			this.dataSync.HOOK = 'data-sync'; // ENTER YOUR CUSTOM DATA ATTRIBUTE
			this.dataSync.serverModel = this.model.toJSON(); // Cache the latest model from the server
			this.dataSync.objects = {}; // Used to store array of objects in view using dataSync

		},

		events: {

			'click .save': 'packageObj',
			'click .cancel': 'cancel',
			'click .accept': 'accept'

		},
		
		render: function () {

			console.log('Render: ', this);
		
			// Render
			this.$el.html( this.template( this.model.toJSON() ) );

			// Init dataSync
			this.initDataSync();

			// Construct your dataSync object array
			var self = this,
				HOOK = this.dataSync.HOOK,
				array = this.$el.find('[' + HOOK + ']');

			$.each(array, function ( index, obj ) {

				var key = $(obj).attr(HOOK); // Value of item's data attribute
				
				self.dataSync.objects[key] = $(this); // Cache jQuery wrapped reference of object

			});
			
			return this;
		
		},

		newAttributes: function() {

			// Return current user entered values
			var _newAttributes = {};

			$.each(this.dataSync.objects, function (key, value) {
				_newAttributes[key] = this.val().trim();
			});
			
			return _newAttributes;

		},

		packageObj: function ( event ) {

			// Create package to send to server

			var self = this,
				clientPackage = {},
				serverModel = this.dataSync.serverModel, // local ref to latest checkout of model
				newAttributes = this.newAttributes();
				clientPackage.passphrase = serverModel; // Put copy of local branch in package

			// Compare submitted values to latest checkout
			$.each(newAttributes, function ( key, value ) {

				var newVal = newAttributes[key],
					branchVal = serverModel[key];

				if ( newVal !== branchVal ) {
					
					clientPackage[key] = newVal; // If values don't match, add them to the package

				}

			});

			this.compareObj(clientPackage); // Send package to server for comparison

		},

		compareObj: function ( clientPackage ) {

			// TODO: This function needs to happen on the server

			console.log('Client package: ', clientPackage);

			// Faking model in database
			var serverModel = {
				first: 'Steve',
				last: 'Evans',
				city: 'Los Angeles',
				state: 'California',
				bio: 'Sartorial vegan fixie enim wayfarers. Cardigan officia bicycle rights, beard thundercats small batch mustache salvia cosby sweater enim. American apparel tattooed culpa, duis craft beer vero food truck fingerstache shoreditch ethical gastropub squid seitan. Hoodie high life +1 nulla, cupidatat kogi proident wolf sunt wayfarers irure. Sartorial eu dolor, deserunt before they sold out organic forage master cleanse. Scenester nesciunt iphone delectus blog skateboard. Vice kale chips minim pinterest bespoke.'
			}

			var self = this,
				serverAttr = {},
				passAttr = {};

			$.each( clientPackage.passphrase, function ( key, value ) {

				var clientVal = clientPackage[key],
					serverVal = serverModel[key], // TODO: Use real model on server
					passVal = clientPackage.passphrase[key];

				// Compare: If neither the value entered nor the value in the
				// passphrase match the server...
				if ( clientVal !== serverVal && passVal !== serverVal ) {

					serverAttr[key] = serverVal; // Add the server value to a new object
					passAttr[key] = passVal; // Add the passphrase value to a new object

				}

			});

			// Compare the two new objects (server values and new passphrase values)
			if ( !_.isEqual( passAttr, serverAttr ) ) {

				this.serverResponse("error", serverAttr);

			} else {

				this.serverResponse("success");

			}

		},

		serverResponse: function ( response, serverAttr ) {

			if ( response === "success" ) {

				console.log("Success!");

				// Successful submission

				this.model.set( this.newAttributes() );

			} else {

				// Failed submission

				console.log('Error mismatch: ', JSON.stringify( serverAttr ) );

				var self = this,
					model = this.model.toJSON(),
					serverModel = this.dataSync.serverModel,
					newAttributes = this.newAttributes();

				$.each(serverAttr, function ( key, value ) {

					var serverVal = value,
						passVal = model[key],
						clientVal = newAttributes[key],
						selector = self.dataSync.objects[key];
					
					if ( serverVal !== passVal && serverVal !== clientVal ) {

						// Error Message - Client to resolve conflicts
						console.log('Server: ', serverVal, ' Checkout: ', passVal, ' Entered: ', clientVal );

						serverModel[key] = serverVal;

						selector.addClass('error').after('<span class="error-label accept" data-sync-value="' + serverVal + '" title="Click to Accept">Theirs: ' + serverVal + '</span>').after('<span class="error-label accept" data-sync-value="' + clientVal + '" title="Click to Accept">Mine: ' + clientVal + '</span>');
					
					}

				});

				this.hasConflicts();

			}

		},

		accept: function ( event ) {

			var $target = $(event.currentTarget),
				value = $target.attr('data-sync-value');

			$target.siblings('input, textarea').val(value).removeClass('error');
			$target.siblings('.error-label').remove();
			$target.remove();

			this.checkErrors();

		},

		cancel: function () {
			
			if ( !_.isEqual( this.dataSync.serverModel, this.model.toJSON() ) ) {

				this.dataSync.serverModel = this.model.toJSON();

			} else {

				this.restoreDefaults();

			}

			$('.save').attr('disabled', 'disabled').text('Save');

			this.clearWarnings();

			return false;

		},

		checkErrors: function () {

			var numErrors = this.$el.find('.error-label').length;

			if ( numErrors < 1 ) {

				this.readyForSubmit();

			}

		},

		hasConflicts: function () {

			this.$el.find('input, textarea, .save').attr('disabled', 'disabled'); // Disable input fields
			$('.save').text('Submit'); // Switch "Save" to "Submit"
			$('div.error').show(); // Show error message

		},

		readyForSubmit: function () {

			$('div.error').hide();
			$('.success').show();
			this.enableSubmit();

		},

		disableSubmit: function () {

			$('.save').attr('disabled', 'disabled');

		},

		enableSubmit: function () {

			$('.save').removeAttr('disabled');

		},

		clearWarnings: function () {

			this.$el.find('input, textarea, .save').removeAttr('disabled').removeClass('error'); // Restore input fields
			this.$el.find('.error-label').remove(); // Remove error lables from DOM
			$('div.error, div.success').hide(); // Hide any error or success messages

		},

		restoreDefaults: function () {

			var self = this;

			$.each(this.dataSync.objects, function (key, obj) {

				obj.val(self.model.get(key));

			});

		},
		
		close: function () {
		
			this.remove();
			this.unbind();
			this.model.off( 'change', this.render, this );
	
			this.$el = null;
			this.el = null;
		
		},
		
	});

	return App.ProfileView;

});