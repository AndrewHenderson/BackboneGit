/**
 * |-------------------|
 * | Backbone-Sync     |
 * |-------------------|
 */
(function (root, factory) {
	if (typeof exports === 'object') {

	var jquery = require('jquery');
	var underscore = require('underscore');
	var backbone = require('backbone');

	module.exports = factory(jquery, underscore, backbone);

	} else if (typeof define === 'function' && define.amd) {

	define(['jquery', 'underscore', 'backbone'], factory);

	} 
}(this, function ($, _, Backbone) {

	Backbone.Sync = (function(Backbone, _, $){
	
	var Sync = {};

	// Sync.View
	// ---------------
	Sync.View = Backbone.View.extend({

		sync: function () {

			console.log('Sync Init', this);

			// Construct dataSync Object
			this.dataSync = {};
			this.dataSync.HOOK = 'data-sync'; // ENTER YOUR CUSTOM DATA ATTRIBUTE
			this.dataSync.checkout = this.model.toJSON(); // Cache the latest model from the server
			this.dataSync.objects = {}; // Used to store array of objects in view using dataSync

			// Construct your dataSync object array
			var self = this,
				HOOK = this.dataSync.HOOK,
				array = this.$el.find('[' + HOOK + ']');

			$.each(array, function ( index, obj ) {

				var key = $(obj).attr(HOOK); // Value of item's data attribute
				
				self.dataSync.objects[key] = $(this); // Cache jQuery wrapped reference of object

			});

			// Cache this views elements
			var self = this;
			this.$save = this.$el.find('.sync-save');
			this.$error = this.$el.find('.sync-error');
			this.$warning = this.$el.find('.sync-warning');
			this.$success = this.$el.find('.sync-success');

			this.$el.on('click', '.sync-save', function() { self.syncSave(); });
			this.$el.on('click', '.sync-cancel', function () { self.syncCancel(); });

		},

		syncAttributes: function() {

			// Return current user entered values
			var _syncAttributes = {};

			$.each(this.dataSync.objects, function (key, value) {
				_syncAttributes[key] = this.val().trim();
			});
			
			return _syncAttributes;

		},

		syncSave: function ( event ) {

			var model = _.omit( this.model.toJSON(), 'timestamp');

			// Only execute if the user has changed the model
			if ( !_.isEqual( model, this.syncAttributes() ) ) {

				// Create package to send to server
				var self = this,
					clientPackage = {},
					checkout = this.dataSync.checkout, // local ref to latest checkout of model
					newAttributes = this.syncAttributes();
				clientPackage.timestamp = checkout.timestamp; // Put checkout timestamp in package

				console.log('Checkout: ', checkout);


				// Compare submitted values to latest checkout
				$.each(newAttributes, function ( key, value ) {

					var newVal = newAttributes[key],
						checkoutVal = checkout[key];

					if ( newVal !== checkoutVal ) {

						console.log('New: ', newVal, 'Checkout: ', checkoutVal);
						
						clientPackage[key] = newVal; // If values don't match, add them to the package

					}

				});

				this.compareOnServer(clientPackage); // Send package to server for comparison TODO: Replace with actual HTTP POST

			}
		
		},

		compareOnServer: function ( clientPackage ) {

			// TODO: This functionality needs to occur on the server

			console.log('Client package: ', clientPackage);

			// Faking model in database
			var serverModel = {
				first: 'Steve',
				last: 'Evans',
				city: 'Los Angeles',
				state: 'California',
				bio: 'Sartorial vegan fixie enim wayfarers. Cardigan officia bicycle rights, beard thundercats small batch mustache salvia cosby sweater enim. American apparel tattooed culpa, duis craft beer vero food truck fingerstache shoreditch ethical gastropub squid seitan. Hoodie high life +1 nulla, cupidatat kogi proident wolf sunt wayfarers irure. Sartorial eu dolor, deserunt before they sold out organic forage master cleanse. Scenester nesciunt iphone delectus blog skateboard. Vice kale chips minim pinterest bespoke.',
				timestamp: 'Mon Nov 12 2012 11:35:00 GMT-0800 (Pacific Standard Time)'
			}

			var self = this;

			// If the timestamp is valid
			if ( _.isEqual( clientPackage.timestamp, serverModel.timestamp ) ) {

				$.each( _.omit(clientPackage, 'timestamp'), function ( key, value ) {

					// Overwrite the server values with the client values
					serverModel[key] = clientPackage[key];

				});

				// Send back an success and the *updated* server model
				this.syncHandleResponse(0, serverModel);

			} else {

				// Send back an error and the server model
				this.syncHandleResponse(1, serverModel);

			}

		},

		syncHandleResponse: function ( message, serverModel ) {

			if ( message === 0 ) {

				console.log("Success!");
				// Successful submission
				this.model.set( serverModel );
				this.dataSync.checkout = serverModel;

			} else {

				console.log('Error timestamp: ', serverModel );

				// Failed submission
				var self = this,
					model = this.model.toJSON(),
					newAttributes = this.syncAttributes();
					this.dataSync.checkout = serverModel;
					this.dataSync.pendingAttributes = this.syncAttributes();

				var clientData = {},
					serverData = {};

				$.each( _.omit(serverModel, 'timestamp'), function ( key, value ) {

					var serverVal = value,
						origVal = model[key],
						newVal = newAttributes[key],
						selector = self.dataSync.objects[key];

					if ( origVal !== newVal && origVal !== serverVal && newVal !== serverVal ) {

						// Error: Client to resolve conflicts
						console.log('Error - Server: ', serverVal, ' Checkout: ', origVal, ' Entered: ', newVal );

						selector.addClass('sync-error').after('<span class="sync-label sync-accept" data-sync-value="' + serverVal + '" title="Click to Accept">Theirs: ' + serverVal + '</span>').after('<span class="sync-label sync-accept" data-sync-value="' + newVal + '" title="Click to Accept">Mine: ' + newVal + '</span>');
					
						clientData[key] = newVal;
						serverData[key] = serverVal;

						self.syncConflict();

					} else if ( origVal !== serverVal && newVal !== serverVal ) {

						console.log('Warning - Server: ', serverVal, ' Checkout: ', origVal, ' Entered: ', newVal );

						// Warning: Client must accept updates to commit.
						selector.val(serverVal).addClass('sync-warning');

						clientData[key] = newVal;
						serverData[key] = serverVal;

						self.syncWarning();

					} else if ( origVal === serverVal && newVal !== serverVal ) {

						console.log('Success - Server: ', serverVal, ' Checkout: ', origVal, ' Entered: ', newVal );

						// Success
						selector.addClass('sync-success');

					}

				});

				// If the data entered had no conflicts despite the incorrect timestamp, re-submit silently.
				if ( _.isEqual( clientData, serverData ) ) {

					this.syncSave();

				}

			}

		},

		syncAccept: function ( event ) {

			console.log(this.dataSync.checkout);

			var $target = $(event.currentTarget),
				value = $target.attr('data-sync-value');

			$target.siblings('input, textarea').val(value).removeClass('sync-error').addClass('sync-success');
			$target.siblings('.sync-label').remove();
			$target.remove();

			this.syncCheck();

		},

		syncCancel: function () {

			if ( !_.isEqual( this.dataSync.checkout, this.model.toJSON() ) ) {

				this.dataSync.checkout = this.model.toJSON();

				var self = this,
					fields = this.dataSync.objects;

				$.each(fields, function ( index, obj ) {

					var key = obj.attr('data-sync'),
						value = self.dataSync.pendingAttributes[key];

					obj.val(value); 

				});

			} else {

				this.syncRestore();

			}

			this.syncClearWarnings();

			return false;

		},

		syncCheck: function () {

			var numErrors = this.$el.find('.sync-label').length;

			if ( numErrors < 1 ) {

				this.syncReady();

			}

		},

		syncLock: function () {

			var self = this;

			$.each(this.dataSync.objects, function ( key, value ) {
				this.attr('disabled', 'disabled'); // Disable input fields
			});

		},

		syncConflict: function () {

			var self = this;

			this.syncLock();
			this.$el.find('.sync-label').on('click', function() { self.syncAccept(event) });
			this.$save.text('Submit').attr('disabled', 'disabled'); // Switch "Save" to "Submit"
			this.$error.show(); // Show error message

		},

		syncWarning: function () {

			this.syncLock();
			this.$save.text('Submit'); // Switch "Save" to "Submit"
			this.$warning.show(); // Show error message

		},

		syncReady: function () {

			this.$error.hide();
			this.$warning.hide();
			this.$success.show();
			this.$save.removeAttr('disabled');

		},

		syncClearWarnings: function () {

			$.each(this.dataSync.objects, function ( key, value ) {
				this.removeAttr('disabled').removeClass('sync-error sync-warning sync-success');; // Disable input fields
			});
			this.$el.find('.sync-label').remove(); // Remove error lables from DOM
			this.$error.hide(); // Hide any error messages
			this.$warning.hide(); // Hide any warning messagess
			this.$success.hide() // Hide any success messages
			this.$save.removeAttr('disabled').text('Save'); // Restore save button

		},

		syncRestore: function () {

			// Restore Latest Synced Values
			var self = this;

			$.each(this.dataSync.objects, function ( key, field ) {

				field.val(self.model.get(key));

			});

		}

	});

	return Sync;

	})(Backbone, _, window.jQuery || window.Zepto || window.ender);
	
	return Backbone.Sync;

}));