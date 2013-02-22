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
    quote: "I'll tell you what I'm blathering about... I've got information man! New shit has come to light! And shit... man, she kidnapped herself. Well sure, man. Look at it... a young trophy wife, in the parlance of our times, you know, and she, uh, uh, owes money all over town, including to known pornographers, and that's cool... that's, that's cool, I'm, I'm saying, she needs money, man. And of course they're going to say that they didn't get it, because... she wants more, man! She's got to feed the monkey, I mean uh... hasn't that ever occurred to you, man? Sir?.",
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
      quote: "I'll tell you what I'm blathering about... I've got information man! New shit has come to light! And shit... man, she kidnapped herself. Well sure, man. Look at it... a young trophy wife, in the parlance of our times, you know, and she, uh, uh, owes money all over town, including to known pornographers, and that's cool... that's, that's cool, I'm, I'm saying, she needs money, man. And of course they're going to say that they didn't get it, because... she wants more, man! She's got to feed the monkey, I mean uh... hasn't that ever occurred to you, man? Sir?.",
  });
  } else {
    res.send(200, req.body);
  }
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});