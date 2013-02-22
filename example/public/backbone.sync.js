/**
 * |--------------------|
 * |   Backbone Merge   |
 * |--------------------|
 */
(function(root, factory) {
  // Set up Backbone appropriately for the environment.
  if (typeof exports !== 'undefined') {
    // Node/CommonJS, no need for jQuery in that case.
    factory(root, exports, require('underscore'));
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, $);
    });
  } else {
    // Browser globals
    root.Backbone = factory(root, root.Backbone, root._, (root.jQuery || root.Zepto || root.ender));
  }
}(this, function(root, Backbone, _, $) {

  Backbone = (function(Backbone, _, $){

    Backbone.View = Backbone.View.extend({

      syncInitialized: false,

      syncInit: function () {

        // Cache this view's *Sync* elements
        var self = this;
        this.$save = this.$('.sync-save');
        this.$cancel = this.$('.sync-cancel');
        this.$error = this.$('.sync-error');
        this.$warning = this.$('.sync-warning');
        this.$success = this.$('.sync-success');

        if ( !this.syncInitialized ) {
          // Construct dataSync Object
          this.sync = {};
          // Configuration
          this.sync.hook = this.syncHook || 'name'; // CAN BE CUSTOMIZED BY VIEW
          this.sync.key = this.syncKey || '_rev';
          // Cache
          this.sync.checkout = this.model.toJSON(); // Latest model from the server
          this.sync.elements = {}; // Used to store array of objects in view using dataSync

          // Construct your dataSync object array
          var self = this,
              hook = this.sync.hook,
              array = this.$('.sync-form [' + hook + ']');

          $.each(array, function ( index, el ) {
            var key = $(el).attr(hook); // Value of item's data attribute
            self.sync.elements[key] = $(this); // Cache jQuery wrapped reference of object
          });

          // Bindings
          this.$el.parent().on('click', '.sync-save', function() { self.syncSave(); });
          this.$el.parent().on('click', '.sync-cancel', function () { self.syncCancel(); });

          this.syncInitialized = true;

        }

      },

      syncOrigAttrs: function() {
        // Return original values that are inputs in sync form
        return _.pick( this.sync.checkout, _.keys(this.sync.elements) );
      },

      syncNewAttrs: function() {

        // Return current user entered values
        var _syncNewAttrs = {};

        $.each(this.sync.elements, function ( key ) {
          _syncNewAttrs[key] = this.val().trim();
        });

        this.sync.pendingAttributes = _syncNewAttrs;
        
        return _syncNewAttrs;
      },

      syncSave: function ( e ) {

        var self = this;
        var newAttrs = this.syncNewAttrs();
        var origAttrs = this.syncOrigAttrs();
        console.log(origAttrs, newAttrs);
        // Only execute if the user has changed the fields
        if ( !_.isEqual( origAttrs, newAttrs ) ) {
          self.model.save(newAttrs, {wait: true})
          .done(function(model, textStatus, jqXHR){
            self.sync.checkout = model;
            self.syncClearWarnings();
          })
          .fail(function(jqXHR, textStatus, errorThrown){
            var model = JSON.parse( jqXHR.responseText );
            self.model.set( self.sync.key, model[self.sync.key], {silent: true} );
            self.syncHandleError( model );
          });
        }
      },

      syncHandleError:  function ( serverModel ) {
        
        // console.log('Conflict - Server: ', serverModel._rev, ', Submitted: ', this.model.toJSON()._rev );

        // If the data entered had no conflicts despite the incorrect version key, act like it was successful.
        if ( _.isEqual( this.syncNewAttrs(), _.pick(serverModel, _.keys(this.sync.elements)  ) ) ) {
          console.log('All set');
        } else {

          // Failed submission
          var self = this,
              model = this.model.toJSON(),
              newAttrs = this.syncNewAttrs();
              this.sync.pendingAttributes = this.syncNewAttrs();

          var clientData = {},
              serverData = {};

          $.each(serverModel, function ( key, value ) {

            var serverVal = value,
                origVal = model[key],
                newVal = newAttrs[key],
                selector = self.sync.elements[key];

            if ( typeof newVal !== 'undefined' ) {

              if ( origVal !== newVal && origVal !== serverVal && newVal !== serverVal ) {

                // Error: Client to resolve conflicts
                // console.log('Conflict - Server: ', serverVal, ', Checkout: ', origVal, ', Entered: ', newVal );

                selector.addClass('sync-error').after('<span class="sync-resolve alert alert-error" data-sync-for="' + key + '" data-sync-value="' + serverVal + '" title="Click to Accept">Theirs: ' + serverVal + '</span>').after('<span class="sync-resolve alert alert-error" data-sync-for="' + key + '" data-sync-value="' + newVal + '" title="Click to Accept">Mine: ' + newVal + '</span>');
              
                clientData[key] = newVal;
                serverData[key] = serverVal;

                self.syncConflict();

              } else if ( origVal !== serverVal && newVal !== serverVal ) {

                // Warning: Client must accept updates to commit.
                // console.log('Warning - Server: ', serverVal, ', Checkout: ', origVal, ', Entered: ', newVal );

                selector.val(serverVal).addClass('sync-warning');

                clientData[key] = newVal;
                serverData[key] = serverVal;

                self.syncWarning();
              }
            }
          });
        }
      },

      syncAccept: function ( event ) {

        // When user accepts a choice on a conflicted field
        var $target = $(event.currentTarget), // Choice selected by user
            selector = $target.data('sync-for'), // Field selector to choice
            value = $target.data('sync-value'), // Value of the choice
            $field = this.$('[' + this.sync.hook + '=' + selector + ']'), // Related field
            $choices = this.$('[data-sync-for=' + selector + ']'); // All choices for this field

        // Set field value to userselection and remove error class, replace with success class
        $field.val(value).removeClass('sync-error').addClass('sync-success');
        $choices.remove(); // Remove choices once user has chosen

        this.syncCheck();
      },

      syncCancel: function () {

        if ( _.isEmpty( this.model.previousAttributes() ) || _.isEqual( this.model.get(this.sync.key), this.sync.checkout[this.sync.key] ) ) {
          this.syncRestoreOrigFields();
        } else {
          this.syncRestoreModel();
          this.syncRestorePendingFields();
        }

        this.syncClearWarnings();

        return false;
      },

      syncCheck: function () {

        var numErrors = this.$el.find('.sync-resolve').length;

        // If there are no errors, display the ready state and allow the user to submit.
        if ( numErrors < 1 ) {
          this.syncReady();
        }
      },

      syncLock: function () {

        // Disable all fields until the user has confirmed warnings and or resolved conflicts
        var self = this;

        $.each(this.sync.elements, function ( key, value ) {
          this.attr('disabled', 'disabled'); // Disable input fields
        });
      },

      syncConflict: function () {

        // Display conflict state
        var self = this;

        this.syncLock();
        this.$('.sync-resolve').on('click', function() { self.syncAccept(event) });
        this.$save.text('Submit').attr('disabled', 'disabled'); // Switch "Save" to "Submit"
        this.$error.show().css("visibility", "visible"); // Show error message
      },

      syncWarning: function () {

        // Display warning state
        this.syncLock();
        this.$save.text('Submit'); // Switch "Save" to "Submit"
        this.$warning.show().css("visibility", "visible"); // Show error message
      },

      syncReady: function () {

        // Display ready state
        this.$error.hide();
        this.$success.show().css("visibility", "visible");
        this.$save.removeAttr('disabled');
      },

      syncClearWarnings: function () {

        // Remove any warnings or messages
        $.each(this.sync.elements, function ( key, value ) {
          this.removeAttr('disabled').removeClass('sync-error sync-warning sync-success');; // Disable input fields
        });
        this.$('.sync-resolve').remove(); // Remove error lables from DOM
        this.$error.hide(); // Hide any error messages
        this.$warning.hide(); // Hide any warning messagess
        this.$success.hide() // Hide any success messages
        this.$save.removeAttr('disabled').text('Save'); // Restore save button
      },

      syncRestoreModel: function() {

        // Restore original values
        if ( this.model.previousAttributes() ) {
          this.model.set(this.sync.checkout, {silent: true});
        }
      },

      syncRestorePendingFields: function () {

        // Restore original values
        var self = this;

        $.each(this.sync.elements, function ( key, field ) {
          field.val(self.sync.pendingAttributes[key]);
        });
      },

      syncRestoreOrigFields: function () {

        var self = this,
            fields = this.sync.elements;

        $.each(fields, function ( key, field ) {
          var val = field.attr(self.sync.hook),
              prev = self.sync.checkout[val];
          field.val(prev); 
        });
      }
    });

  return Backbone;

  })(Backbone, _, window.jQuery || window.Zepto || window.ender);
  
  return Backbone;
}));