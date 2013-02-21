var express = require('express'),
    http = require('http'),
    path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/api/user', function(req, res){
  res.send(200, {
    _id: 'dude',
    _rev : '1-fe45a3e06244adbe7ba145e74e57aba5',
    first: 'Jeffrey',
    last: 'Lebowski',
    city: 'Los Angeles',
    state: 'California',
    bio: 'Sartorial vegan fixie enim wayfarers. Cardigan officia bicycle rights, beard thundercats small batch mustache salvia cosby sweater enim. American apparel tattooed culpa, duis craft beer vero food truck fingerstache shoreditch ethical gastropub squid seitan. Hoodie high life +1 nulla, cupidatat kogi proident wolf sunt wayfarers irure. Sartorial eu dolor, deserunt before they sold out organic forage master cleanse. Scenester nesciunt iphone delectus blog skateboard. Vice kale chips minim pinterest bespoke.',
  });
});
app.put('/api/user/:id', function(req, res){
  // Your database save attempt here
  var db_rev = "2-7797151c40fbd266c6003858f608c58e";
  if(req.body._rev !== db_rev) {
    res.send(409, {
      _id: "dude",
      _rev: '2-7797151c40fbd266c6003858f608c58e',
      first: 'Walter',
      last: 'Sobchak',
      city: 'Los Angeles',
      state: 'California',
      bio: 'Sartorial vegan fixie enim wayfarers. Cardigan officia bicycle rights, beard thundercats small batch mustache salvia cosby sweater enim. American apparel tattooed culpa, duis craft beer vero food truck fingerstache shoreditch ethical gastropub squid seitan. Hoodie high life +1 nulla, cupidatat kogi proident wolf sunt wayfarers irure. Sartorial eu dolor, deserunt before they sold out organic forage master cleanse. Scenester nesciunt iphone delectus blog skateboard. Vice kale chips minim pinterest bespoke.',
    });
  } else {
    res.send(200, req.body);
  }
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});