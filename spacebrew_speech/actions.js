var intervalID = 0;
var oldString = "";
var newString = "";

$(function() {
	console.log("All Scripts Go!");


	// $('#talk').live('change', function() { 
	// 	console.log("It Changed!");
	// 	console.log( $(this).val() );
	// });


	intervalId = setInterval(update, 100);
	return intervalId;


	//$(document).mousemove(onMouseMove);
	// function onMouseMove(){
	// 	//console.log( "MOVE" );
	// 	console.log( $("#talk").val() );
	// }

	//$("#talk").select();

	$('#talk').click(function(){
		$('#talk').click();
	});

});


function update(){

	//////////////////
	// Check to see if the field has updated
	//
	newString = $("#talk").val();
	if (oldString != newString){
		oldString = newString;
		//console.log(newString);

      	console.log("Sending message "+newString); 
        sb.send("text", "string", newString);
        //sb.send("randomRange", "range", Math.floor(Math.random()*1024) );

        $("#talk").val("");
		oldString = "";
		newString = "";

		$("#talk").select();
	}


};