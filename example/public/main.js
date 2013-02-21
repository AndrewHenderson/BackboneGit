$(function(){

  // Model
  // =======
  var Model = Backbone.Model.extend({
    urlRoot: 'api/user',
    idAttribute: '_id'
  });

  var model = new Model();

  model.fetch();

  // View
  // =======
  var View = Backbone.View.extend({
  
    template: _.template( $('#profile-tpl').html() ),

    initialize: function () {

      this.listenTo( this.model, 'change', this.render, this );
    },

    render: function () {

      this.$el.html( this.template( this.model.toJSON() ) ); // Render
      this.syncInit(); // Sync Init

      return this;
    }
  });

  var view = new View({
    model: model
  });


  // Action
  // =======
  $('#main-page').append( view.el );
});