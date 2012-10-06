$(document).bind("pageinit", function() {
	console.log("JQuery Mobile Page Made")

	$(".slider").bind( "change", function(event, ui) {
		console.log(event,event.target.valueAsNumber);
		spaceSendMessage(
			{
				clientName:name,
				name:event.target.id,
				type:"range",
				value:event.target.valueAsNumber
			}
		);
	});
});