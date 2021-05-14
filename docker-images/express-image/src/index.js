var Chance = require('chance');
var chance = new Chance();

var express = require('express')
var app = express();

console.log("Bonjour " + chance.name());

app.get('/animals/ocean', function(req, res) {
	res.send(listOfAnimals('ocean'));
});

app.get('/animals/desert', function(req, res) {
	res.send(listOfAnimals('desert'));
});

app.get('/animals/pet', function(req, res) {
	res.send(listOfAnimals('pet'));
});

app.get('/', function(req, res) {
	res.send("Hello, to get a list of available animals, go to /animals/type route ! (available types are : ocean, desert, pet)");
});

app.listen(3000, function() {
	console.log("Accepting HTTP requests on port 3000")
});

function listOfAnimals(type) {
	var nbAnimals = chance.integer({
		min: 1,
		max: 10
	});

	console.log(nbAnimals)

	var animals = []

	for (var i = 0; i < nbAnimals; ++i) {
		var gender = chance.gender();
		var birthYear = chance.year({
			min: 1990,
			max: 2020
		});

		animals.push({
			name: chance.first({
				gender: gender
			}),
			race: chance.animal({
				type: type
			}),
			birth: chance.birthday({
				gender: birthYear
			})
		});
	}

	console.log(animals);
		return animals;
}