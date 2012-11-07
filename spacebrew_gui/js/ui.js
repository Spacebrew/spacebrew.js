$(document).bind("pageinit", function() {
	console.log("JQuery Mobile Page Made")

	$(".slider").bind( "change", function(event, ui) {
		console.log(event,event.target.valueAsNumber);
		sb.send(event.target.id, "range", event.target.valueAsNumber);
	});
});