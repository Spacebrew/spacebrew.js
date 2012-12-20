/*!
 *  Colored Screen :: Connection  *
 * 
 *  This file includes methods that handle incoming and outgoing Spacebrew messages
 *  and other Spacebrew events such as onOpen and onClose.
 *  
 *  <br />Copyright (C) 2012 LAB at Rockwell Group http://lab.rockwellgroup.com
 *
 * @filename    connection.js
 * @author      The Lab (Julio)
 * @modified    10/23/2012
 * @version     1.0.0
 * 
 */

/**
 * onString function that processes string messages received from spacebrew. 
 * @param  {String} inlet Name of the inlet where the message was received
 * @param  {String} msg   The message itself
 * @return {none}       
 */
var onString = function (inlet, msg) {
}

/**
 * onRange Processes integer range messages received through spacebrew.
 * @param  {String} inlet Name of inlet where message was received
 * @param  {Integer} msg   Message itself
 * @return {none}       
 */
var onRange = function (inlet, msg) {

  // loop through state.color object to see if the inlet is being listened to
  var update_color = false;
  for (var i in state.ids.color) {
    var component = state.ids.color[i];
    if (inlet.indexOf(component) == 0 && (inlet.length == component.length)) {
      var new_val = mapVal(msg, 0, 1024, state.bounds.color.low[component], state.bounds.color.high[component]);
      if (state.color[component] != new_val) {      
        state.color[component] = new_val;
        update_color = true;
      }
    }
  }

  if (update_color) {
    if (debug) console.log("[onRange] updating color to ", state.color);
    var new_color = "hsl(";
    for (var component in state.color) {
      new_color = "" + new_color + state.color[component];
      if ((component.indexOf("sat") == 0) || (component.indexOf("light") == 0)) new_color += "%";
      if ((component.indexOf("hue") == 0) || (component.indexOf("sat") == 0)) new_color += ",";
      if (component.indexOf("light") == 0) new_color += ")";
    }
    if (debug) console.log("[onRange] new_color " + new_color);
    $("body").css("background-color", new_color);
  }
}


/**
 * onOpen callback method that handles the on open event for the Spacebrew connection.
 * @return {none} 
 */
var onOpen = function () {
  sb.connected = true;
  if (debug) console.log("[onOpen:setup] connection established prepping form");
  var newString = "Connection established with server at '" + qs.server + "'\n\n";
  $("#statusMsgDiv p").html(htmlForTextWithEmbeddedNewlines(newString));
  $("#statusMsgDiv").css('display', 'none');
}

/**
 * onClose callback method that handles the on close event for the Spacebrew Connection.  
 * @return {none} 
 */
var onClose = function () {
  sb.connected = false;
  if (debug) console.log("[onClose:setup] connection closed");
  $("#statusMsgDiv").css('display', 'block');

  var newString = "Connection attempt failed or spacebrew server no longer available at '" + qs.server + "'\n\n" +
                  "Please reload the page and make sure that you've specified the correct spacebrew server address. ";
  if (!window.getQueryString('server')) {
    var conn = "?";
    if (qs.href.indexOf("?") != 1) conn = "&";    
    newString = newString + "This is how you can specify the server address in the webapp url (" +
                            "just replace 'server_address' with the Spacebrew server's address):\n\n" + 
                            qs.href + conn + "server=server_address&"             
  }
  $("#statusMsgDiv p").html(htmlForTextWithEmbeddedNewlines(newString));
}