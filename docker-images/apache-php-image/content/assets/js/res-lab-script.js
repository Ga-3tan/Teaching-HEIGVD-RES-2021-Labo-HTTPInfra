$(function() {
    console.log("Loading emoji");
    
    function loadEmoji() {
        $.get("/api/fun/emoji", function(emoji) {
            console.log(emoji);
            $(".emoji").text(emoji);
        });
    };
    
    loadEmoji();
    setInterval(loadEmoji, 5000);
});