function gup( name ) {
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( window.location.href );
  if( results == null )
    return "";
  else
    return results[1];
}

var index = 0;
var name = gup('name') || "SpaceGUI " + gup('id') || "Untitled SpaceGUI"; 
var server = gup('server') || 'localhost';

var buttonPress = false;
var buttonText = "";

var myConfig = {
"config": {
 "name": name,
 "description": "GUI for sending and displaying SpaceBrew values.",
 "publish": {
   "messages": [
     {
       "name": "slider1",
       "type": "range",
       "default": "500"
     },
     {
       "name": "slider2",
       "type": "range",
       "default": "500"
     }
   ]
 },
 "subscribe": {
   "messages": [
     {
       "name": "slider1",
       "type": "range"
     },
     {
       "name": "slider2",
       "type": "range"
     }
   ]
 }
}
};

var ws = new WebSocket("ws://"+server+":9000");
    ws.onopen = function() {
        console.log("WebSockets connection opened");
        console.log("my name is: "+name);

      // send my config
      ws.send(JSON.stringify(myConfig));
    }
    ws.onmessage = function(e) {
        console.log("Got WebSockets message: " + e.data);
        

        var currName = JSON.parse(e.data).message.name;
        var currType = JSON.parse(e.data).message.type;
        //currName = "partyMode";
        var currValue = JSON.parse(e.data).message.value;
        
        if (currType == "boolean") {
          currValue = Boolean(currValue);
          console.log("Cast to boolean");
        }
        //currValue = "BIG RED BUTTON";
        console.log(currName+" : "+currValue);

        $("#"+currName).slider('refresh', currValue)


        // if it's a partyMode
        if (currName == "partyMode") {
          console.log("received partymode message");
          if (currValue == true) {
             partyModeOn = true;
             console.log(partyModeOn);
          } else {
            partyModeOn = false;
          }
        }

        // if it's a color
        if (currName == "color") {
          console.log("received color message");
          changeBGC(currValue);
        }

        // if it’s a text
        if (currName == "text") {
          console.log("received text message"); 
          buttonText = currValue; 
          document.getElementById("buttonMsg").innerHTML = currValue;        
        } 

    }
    ws.onclose = function() {
        console.log("WebSockets connection closed");
    }


//-------------------------------------------------------
function setup (){
	// JQuery Setup
}

function spaceSendMessage (m){
  //ecs.sendMessage("packet", 255);
  console.log("Space Message");

  var message = {message:
       {
           clientName:name,
           name:m.name,
           type:m.type,
           value:m.value
       }
    };

    //console.log(message);
    ws.send(JSON.stringify(message));
}


/*
function incrementIndex() {
    index += 1;
    //console.log(index);
}

function changeBGC(pColor){
  var tColor = "rgb("+Math.floor(pColor/4)+","+Math.floor(pColor/4)+","+Math.floor(pColor/4)+")";
  document.body.style.background = tColor; //color;
  console.log(tColor);
  console.log("Changed color");
}

//-------------------------------------------------------
function onMouseDown (evt){
	//ecs.sendMessage("packet", 255);
	console.log("Sending message");

	var message = {message:
       {
           clientName:name,
           name:"buttonPress",
           type:"boolean",
           value:"true"
       }
   	};

   	//console.log(message);
   	ws.send(JSON.stringify(message));
}
*/
