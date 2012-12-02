/*!
 *  iPhone Events :: Main  *
 * 
 *  Initializes the main variables that are used in this webapp, opens and configures the SpaceBrew connection,
 *  checks if device is an iphone to customize css as appropriate, registers all listeners for iphone movement
 *  and orientation events.
 *  
 *  <br />Copyright (C) 2012 LAB at Rockwell Group http://lab.rockwellgroup.com
 *
 * @filename    main.js
 * @author      The Lab (Julio)
 * @modified    10/23/2012
 * @version     1.0.0
 * 
 */

var outletOutletDefault = '5';  // the default number of outlets and inlets, if not defined via query string

var sb = {};
    sb.connection = [];     // spacebrew connection
    sb.connected = false;
    sb.msgIn = "";          // latest incoming messages
    sb.msgs = [];           // array with most recent incoming messages
    sb.msgsLen = 5;         // number of incoming messages to save in arrray
    sb.publish = [];        // list with names of the publish routes (outlets)
    sb.subscribe = [];      // list with names of the subscribe routes (inlets)

var qs = {};
    qs.href = window.location.href;
    qs.name = window.getQueryString('name') || "iPhoneEventForwarder" + (window.getQueryString('id') ? (" " + window.getQueryString('id')) : "");	// name of app in spacebrew
    qs.server = window.getQueryString('server') || 'localhost';					    // name of spacebrew server
    qs.debug = (window.getQueryString('debug') == "true") ? true : false;		// debug flag


var state = {};
    state.names = ["accel", "gyro"];
    state.accel = { x: 0, y: 0, z: 0 };
    state.gyro = { alpha: 0, beta: 0, gamma: 0 };
    state.bounds = {};
    state.ids = {};

    state.ids.accel = ["x", "y", "z"];
    state.ids.gyro = ["alpha", "beta", "gamma"];

    state.bounds.accel = {
      low: { x: -10, y: -10, z: -10 },
      high: { x: 10, y: 10, z: 10 }
    };

    state.bounds.gyro = {
      low: { alpha: 0, beta: -90, gamma: -180 },
      high: { alpha: 360, beta: 90, gamma: 180 }
    };

var debug = debug || qs.debug || false;	// flag to identify if debug messages should be output

$(window).bind("load", function() {
	if (debug) console.log("[main.js] DEBUGGING IS ON")
  deviceCheck();
	setup();
  registerIphoneEvents();
});


/**
 * setup Sets up the SpaceBrew connection, configures subscribe and publish configurations, and 
 * 		links the onString callback method. Also builds the input forms once connections has been 
 * 		established.
 * @return {none} 
 */
function setup (){
  // setup spacebrew
  if (debug) console.log("[setup] setting up connection to Spacebrew");
  var description = "A simple tool for transforming text messages in Spacebrew. It just responds to messages by sending other messages.";
  sb.connection = new Spacebrew.Client(qs.server, qs.name, description);

  var newString = "Attempting to connect to the spacebrew server at '" + qs.server + "'";
  $("#statusMsgDiv p").text(newString);

  sb.connection.addPublish( "accel", "string" );
  sb.connection.addPublish( "accel_x", "range" );
  sb.connection.addPublish( "accel_y", "range" );
  sb.connection.addPublish( "accel_z", "range" );
  sb.connection.addPublish( "gyro", "string" );
  sb.connection.addPublish( "gyro_alpha", "range" );
  sb.connection.addPublish( "gyro_beta", "range" );
  sb.connection.addPublish( "gyro_gamma", "range" );

  // Override Spacebrew events
  sb.connection.onStringMessage = onString.bind(this);
  sb.connection.onOpen = onOpen.bind(this);
  sb.connection.onClose = onClose.bind(this);
  sb.connection.connect();

  if (debug) console.log( "[setup] attempted to connect to spacebrew" ); 
}

/**
 * htmlForTextWithEmbeddedNewLines Converts all '\n' in a string to '<br>' in preparation for
 *    the string to be injected into an html page.
 * @param  {String} text The incoming string that will be processed (with '\n's)
 * @return {String}      The processed string (with '<br>'s)
 */
function htmlForTextWithEmbeddedNewlines(text) {
    var htmls = [];
    var lines = text.split(/\n/);
    for (var i = 0 ; i < lines.length ; i++) {
        htmls.push(
            $(document.createElement('div')).text(lines[i]).html()
        );
    }
    return htmls.join("<br>");
}

/**
 * deviceCheck Updates css elements for iPhones.
 * @return {none} 
 */
var deviceCheck = function () {
  if( navigator.userAgent.match(/iPhone/i) ) {
    $("header").css("width", "280px");
    $("header h1").css("width", "280px");
    $("header p").css("width", "280px");

    $("#statusMsgDiv").css("width", "280px");
    $("#statusMsgDiv h1").css("width", "280px");
    $("#statusMsgDiv p").css("width", "280px");

    $("#deviceMsgDiv").css("width", "280px");
    $("#deviceMsgDiv h1").css("width", "280px");
    $("#deviceMsgDiv ul").css("width", "280px");

    $("#deviceMsgDiv li").css("padding-top", "15px");
    $("#colorMsgDiv li").css("padding-top", "15px");

    $("#statusMsgDiv").css("padding", "20px 20px");
    $("#deviceMsgDiv").css("padding", "20px 20px");
    $("header").css("padding", "20px 20px");
  } else {
    console.log("[deviceCheck] navigator userAgent ", navigator.userAgent);
  }  
}

/**
 * registerIphoneEvents Register callback methods for accelerometer and gyrometer events.
 *   If connected to Spacebrew, messages are sent when a new event is received.
 * @return {none} 
 */
var registerIphoneEvents = function () {
  console.log("[registerIphoneEvents] window object ", window );

  // check if device has an accelerometer, and if so, then register an event handler
  if (window.DeviceMotionEvent) {
    if (debug) console.log("[registerIphoneEvents] accel motion event available " );
    window.addEventListener("devicemotion", function() {
      processEvent("accel", event.accelerationIncludingGravity);
    }, true);  
  } else {
    $("#deviceMsgaccel h1").html(htmlForTextWithEmbeddedNewlines("accel"));    
    $("#deviceMsgaccel p").html(htmlForTextWithEmbeddedNewlines("data\nnot\navailable"));    
  }

  // check if device has an gyrometer, and if so, then register an event handler
  if (window.DeviceOrientationEvent) {
    if (debug) console.log("[registerIphoneEvents] gyro device orientation event available " );
    window.addEventListener("deviceorientation", function() {
      processEvent("gyro", event);
    }, true);    
  } else {
    $("#deviceMsggyro h1").html(htmlForTextWithEmbeddedNewlines("gyro"));    
    $("#deviceMsggyro p").html(htmlForTextWithEmbeddedNewlines("data\nnot\navailable"));    
  }
}

/**
 * processEvent Processes new events and in response updates the data on the UI, and sends
 *   the appropriate Spacebrew messages.
 * @param  {String} name The name of the sensor associated to this event
 * @param  {Object} data An object that includes data about all sources associated to the sensor
 *                       named in the previous paramter. This object needs to feature the appropriate
 *                       attribute names in order for the method to process them.
 * @return {none}      
 */
var processEvent = function (name, data) {
  var debug = false;
  // loop through the name of all available sensors
  for (var i in state.names) {

    if (debug) console.log("[processEvent] comparing '" + name + "' to '" + state.names[i] + "'");
    if (name.indexOf(state.names[i]) == 0) {
      var sensor = state.names[i];
      var parts = state.ids[sensor];
      var new_data = false;
      var div_id = "#" + "deviceMsg" + state.names[i];
      var newString = "";

      // loop through each source associated to the current sensor
      for (var p in parts) {
        var part = parts[p];
        if (!data[part]) continue; // if data[part] doesn't exist then skip to next part
        var new_state = mapVal( data[part], state.bounds[sensor]["low"][part], 
                                 state.bounds[sensor]["high"][part], 0, 1024 );

        // if the new state is different from state[sensor][part] then update state[sensor][part]
        if (state[sensor][part] != new_state) {
          state[sensor][part] = new_state;
          if (debug) console.log("[processEvent] new value for " + sensor + " part " + part + " val " + state[sensor][part] );

          // if connected to spacebrew then send messages
          if (sb.connected) {
            var outlet_name = sensor + "_" + part;
            sb.connection.send(outlet_name, "range", state[sensor][part]); 
            new_data = true;
          }
        }
        newString = newString + part + ": " + state[sensor][part] + "\n";
      }

      // if any of the sensor sources were updated then send a summary message
      if (new_data && sb.connected) sb.connection.send(sensor, "string", JSON.stringify(state[sensor]));      
      $(div_id + " h1").html(htmlForTextWithEmbeddedNewlines(state.names[i]));
      $(div_id + " p").html(htmlForTextWithEmbeddedNewlines(newString));
      if (debug) console.log("[processEvent] updated sensor data ", state[sensor] );
    }
  }
}


/**
 * mapVal Maps a value in a similar way to the Arduino and Processing map method. It takes a value, along
 *   with source min and max values, and target min and max values. Then it converts the value from the 
 *   source to the target range.
 * @param  {Integer} value      The value that will be mapped.
 * @param  {Integer} source_min The minimum value for the source range.
 * @param  {Integer} source_max The maximum value for the source range.
 * @param  {Integer} target_min The minimum value for the target/outgoing range.
 * @param  {Integer} target_max The maximum value for the target/outgoing range.
 * @return {Integer}            The mapped value.
 */
var mapVal = function(value, source_min, source_max, target_min, target_max) {
  if (!(value && source_min && source_max && target_min  && target_max)) "missing parameter";
  if (isNaN(value) || isNaN(source_min) || isNaN(source_max) || isNaN(target_min) || isNaN(target_max)) "not a number";
  if (value > source_max) value = source_max;
  if (value < source_min) value = source_min;
  var source_delta = source_max - source_min;
  var target_delta = target_max - target_min;
  var value_abs = value - source_min;
  var mapped_abs = value_abs * (target_delta / source_delta);
  var mapped_final = target_min + mapped_abs;

  return Math.round(mapped_final);
}

