define(['jquery', 'underscore', 'backbone', 'handlebars', 'widgets/textinput', 'text!templates/profileTemplate.html'],
function ( $, _, Backbone, Handlebars, TextInput, ProfileTemplate ) {

	'use strict';

	App.ProfileView = Backbone.View.extend({
	
		template: Handlebars.compile( ProfileTemplate ),
		
		initialize: function () {

			// this.model.on( 'change', this.render, this );

			// this.storeLocalCopy( this.model );
		
		},

		storeLocalCopy: function ( latestCheckout ) {

			// Create a local branch of the latest checkout to keep in LocalStorage

			// var latestCheckout = JSON.stringify( latestCheckout );

			// localStorage.setItem( 'local-branch', latestCheckout );

		},

		events: {

			'click .save': 'packageObj',
			'click .cancel': 'cancel',
			'click .mine': 'takeMine',
			'click .theirs': 'takeTheirs'

		},
		
		render: function () {

			console.log('render...');
		
			// Render
			this.$el.html( this.template( this.model.toJSON() ) );

			// Construct dataSync Object
			this.dataSync = {};
			this.dataSync.HOOK = 'data-sync'; // ENTER YOUR CUSTOM DATA ATTRIBUTE
			this.dataSync.objects = {};

			var HOOK = this.dataSync.HOOK,
				array = this.$el.find('[' + HOOK + ']'),
				self = this;

			$.each(array, function ( index, obj ) {

				var key = $(obj).attr(HOOK); // Value of item's data attribute
				
				self.dataSync.objects[key] = $(this); // e.g. this.$first

			});

			console.log(this);
			
			return this;
		
		},

		newAttributes: function() {

			// Return current user entered values
			var _newAttributes = {};

			$.each(this.dataSync.objects, function(key, value) {
				_newAttributes[key] = this.val().trim();
			});
			
			return _newAttributes;

		},

		packageObj: function ( event ) {

			// Create package to send to server
			console.log('packaging new object...');

			var self = this,
				clientPackage = {},
				localBranch = this.model.toJSON(),
				newAttributes = this.newAttributes();
				clientPackage.passphrase = localBranch; // Put copy of local branch in package

			// Compare current values to latest checkout
			$.each(newAttributes, function ( key, value ) {

				var _newVal = newAttributes[key],
					_copyVal = localBranch[key];

				if ( _newVal !== _copyVal ) {
					
					clientPackage[key] = _newVal; // If values to match add them to the package

				}

			});

			this.compareObj(clientPackage); // Send package to server for comparison

		},

		compareObj: function ( modelFromClient ) {

			console.log('Obj from client: ', modelFromClient);

			var self = this,
				serverAttr = {},
				passAttr = {};

			$.each( modelFromClient.passphrase, function ( key, value ) {

				var clientVal = modelFromClient[key],
					serverVal = self.modelOnServer[key],
					passVal = modelFromClient.passphrase[key];

				// Compare: If neither the value entered nor the value in the passphrase match the server...
				if ( clientVal !== serverVal && passVal !== serverVal ) {

					serverAttr[key] = serverVal; // Add the server value to a new object
					passAttr[key] = passVal; // Add the passphrase value to a new object

				}

			});

			// Compare the two new objects (server values and new passphrase)
			if ( !_.isEqual( passAttr, serverAttr ) ) {

				console.log("doesn't match server copy");

				this.serverResponse("error", serverAttr);

			} else {

				console.log("matches server copy");

				this.serverResponse("success");

			}

		},

		serverResponse: function ( response, serverAttr ) {

			if ( response === "error" ) {

				// Failed submission

				var self = this,
					localCopy = this.model.toJSON(),
					modelOnServer = this.model.clone().toJSON(),
					newAttributes = this.newAttributes();

				$.each(serverAttr, function ( key, value ) {

					var serverVal = value,
						passVal = localCopy[key],
						clientVal = newAttributes[key],
						selector = self.dataSync.objects[key];
					
					if ( serverVal !== passVal && serverVal !== clientVal ) {

						// Error Message - Client to resolve conflicts
						console.log('mismatch: ', 'server: ', serverVal, ' local: ', passVal, ' entered: ', clientVal );

						self.hasConflicts();

						modelOnServer[key] = serverVal;

						selector.addClass('error').after('<span class="error-label mine" data-value="' + serverVal + '">Theirs: ' + serverVal + '</span>').after('<span class="error-label mine" data-value="' + clientVal + '">Mine: ' + clientVal + '</span>');
					
					}

				});

				this.$el.find('input, textarea').attr('disabled', 'disabled');

				this.model.set(modelOnServer);
				this.model._previousAttributes = localCopy;

			} else {

				// Successful submission

				this.removeErrors();

				if ( !_.isEqual(this.model, this.newAttributes() ) ) {

					this.model.set( this.newAttributes() );
					this.render();

				} else {

					this.render();

				}

				if ( this.model.toJSON !== this.model._previousAttributes ) {

					this.model.toJSON = this.model._previousAttributes;

				}

				this.modelOnServer = this.newAttributes();
				this.storeLocalCopy( this.modelOnServer );

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

			var previousBranch = this.model._previousAttributes;

			console.log(previousBranch, this.model.toJSON());
			
			if ( !_.isEqual( previousBranch, this.model.toJSON() ) ) {

				this.model.set(previousBranch);

			} else {

				this.restoreDefaults();

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
			this.$el.find('.error-label').remove();
			$('input, textarea').removeAttr('disabled');

			this.removeMessages();

		},

		removeMessages: function () {

			$('div.error, div.success').hide();

		},

		hasConflicts: function () {

			$('div.error').show();
			$('.save').attr('disabled', 'disabled').text('Submit');

		},

		disableSubmit: function () {

			$('.save').attr('disabled', 'disabled');

		},

		enableSubmit: function () {

			$('.save').removeAttr('disabled');

		},

		restoreDefaults: function () {

			var self = this;

			$.each(this.dataSync.objects, function (key, obj) {

				console.log(self.model.get(key));

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

		modelOnServer: {
			first: 'Steve',
			last: 'Evans',
			city: 'Los Angeles',
			state: 'California',
			bio: 'Sartorial vegan fixie enim wayfarers. Cardigan officia bicycle rights, beard thundercats small batch mustache salvia cosby sweater enim. American apparel tattooed culpa, duis craft beer vero food truck fingerstache shoreditch ethical gastropub squid seitan. Hoodie high life +1 nulla, cupidatat kogi proident wolf sunt wayfarers irure. Sartorial eu dolor, deserunt before they sold out organic forage master cleanse. Scenester nesciunt iphone delectus blog skateboard. Vice kale chips minim pinterest bespoke.'
		},
		
	});

	return App.ProfileView;

});