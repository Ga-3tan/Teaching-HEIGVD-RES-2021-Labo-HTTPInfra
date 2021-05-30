var Chance = require('chance');
var chance = new Chance();

var knockknock = require('knock-knock-jokes');

var randomJpnEmoji = require("random-jpn-emoji");

var express = require('express');
var app = express();

app.get('/emoji', function(req, res) {
   var rd = chance.integer({ min: 0, max: 3 });
   var response;
   switch (rd) {
        case 0: 
            response = randomJpnEmoji.happy();
            break;
        case 1: 
            response = randomJpnEmoji.sad();
            break;
        case 2: 
            response = randomJpnEmoji.helpless();
            break;
        default: 
            response = randomJpnEmoji.shock();
   }
   res.send(response);
});

app.get('/knock-knock', function(req, res) {

	var listJokes = {knock1: knockknock(),
					 knock2: knockknock()};

    res.send(listJokes);
});

app.get('/coin-flip/:face', function(req, res) {
    var coin = chance.coin();
    var response = "It's " + coin + ". ";
    if (req.params.face != "tails" && req.params.face != "heads") {
        res.send("You must bet : tails or heads");
    } else if (coin == req.params.face) {
        res.send(response + "Congrats you won : " + chance.dollar());
    } else {
        res.send(response + "You lost : " + chance.dollar());
    }
});

app.get('/', function(req, res) {
    res.send("Hello, this endpoint is empty, try /coin-flip/:face or /knock-knock");
});

app.listen(3000, function() {
    console.log("Accepting HTTP requests on port 3000.");
});
