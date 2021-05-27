$(function() {
    console.log("Loading animals");

    // Function that displays an animal name
    function loadAnimals() {
        
        // Selects the category
        var value = Math.floor(Math.random() * 3);
        var category = "ocean";
        if (value == 1) { category = "desert"; }
        else if (value == 2) { category = "pet"; }

        // Sets the message
        $.getJSON("/api/animals/" + category + "/", function(animals) {
            var message = "No animal found";
            if (animals.length > 0) {
                message = animals[0].name + " the " + animals[0].species + " says hello !"
            }
            $(".skills").text(message);
        });
    };

    // Loads the function periodically
    loadAnimals();
    setInterval(loadAnimals, 2000);
});