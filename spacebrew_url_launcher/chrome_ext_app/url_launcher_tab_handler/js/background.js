/*!
 *  URL Launcher :: Background  *
 * 
 * 	A javascript file that sets up a connection between the URL launcher 
 * 	and Spacebrew, and then to create also creates instance of the 
 * 	UrlLauncherAndTabHandler class to manage tab state.
 * 	
 *  <br />Copyright (C) 2012 LAB at Rockwell Group http://lab.rockwellgroup.com
 *
 * @filename    background.js
 * @author      The Lab (Julio Terra)
 * @modified    10/23/2012
 * @version     1.0.5
 * 
 */

var debug = false;

var content = {};
	content.qs_attrs = ["debug", "keep_tabs", "loose_focus", "go_fullscreen", "url_launcher", "timeout"],
	content.qs_active = "";
	content.qs_cur = {};
	content.url_active = "";
	content.idle_timeout = 0;
	content.tab_handler;

var	sb = {};
	sb.connected = false;
	sb.default_name = "sbUrlLauncher";
    sb.connection = {};     // spacebrew connection


/**
 * setup Register listener for messages from content script
 * @return {none} 
 */
setup = function() {
 	if (debug) console.log("[setup] added content script request listener listener ");
	chrome.extension.onRequest.addListener(readRequest);
}

/**
 * readRequest Callback method that handles all messages from content scripts that are inserted into webpages.
 * 		if the message contains a "href" attribute then the message is as a new page query string registration. 
 * 		In response and as appropriate, this method starts up the spacebrew connection, and creates the 
 * 		UrlLauncherAndTabHandler object that manages the tab focus and fullscreen modes, and sends a response back to 
 * 		content script that confirms if the connection has been established. If the message contains an "idle" 
 * 		attribute then it handles this message as an update regarding the active/idle state of a webpage.
 * @param  {object} _request     Data that is passed from the content script to the background app.
 * @param  {object} sender       Information about the source of the message that was just received.
 * @param  {function} sendResponse Callback method that should be called when we have finished processing the
 *                                  request.
 * @return {none}
 */
readRequest = function(_request, sender, sendResponse) {
 	if (debug) console.log("[readRequest] new request from content script in tab " + sender.tab.id + " request: ");
 	if (debug) console.log(_request);
	var response = {live_status: true};
	content.qs_cur = _request;

 	if (content.qs_cur.href) {
		if (!sb.connected && content.qs_cur.url_launcher) sbConnect(content.qs_cur.name, content.qs_cur.server);
		content.tab_handler = content.tab_handler || new LABcx.UrlLauncherAndTabHandler();
		debug = content.qs_cur.debug;

		if (content.qs_cur.active) {
			content.qs_cur.tab = sender.tab;
			content.tab_handler.updateOptions(content.qs_cur);
			prepQueryString(content.qs_cur);			
		}

		if (content.qs_cur.timeout > 0) {
		 	response.idle = content.idle_timeout = content.qs_cur.timeout;
		 	if (debug) console.log("[readRequest] adding idle timer set-up request to response ", response);
		}
	} 

	if (content.qs_cur.idle) {
	 	if (debug) console.log("[readRequest] sending idle message via sb ", content.qs_cur);
		sb.connection.send("im_bored", "boolean", true);
		if (content.url_active) content.tab_handler.setActiveUrl(content.url_active);
	}

	sendResponse(response);
}

/**
 * sbConnect method that registers the websockets callback methods once the websockets
 * 		connection request has been made. It first sets up the spacebrew configuration message,
 * 		which is then used, along with the name variable to register this app with the
 * 		Spacebrew server. Then it registers the onopen, onmessage and onclose methods.
 * @param  {string} name Name of the app for the spacebrew server
 * @return {none}      
 */
sbConnect = function (name, server) {
	// prepare name, server and description values to configure Spacebrew connection
	name = name ? name : sb.default_name;
	server = server ? server : "localhost";
	var description = "A simple tool for transforming text messages in Spacebrew. It just responds to messages by sending other messages.";

	// create Spacebrew client object
	sb.connection = new Spacebrew.Client(server, name, description);

	// configure subscriptions and publishing channels, and register callback methods
    sb.connection.addSubscribe( "url_please", "string" );
    sb.connection.addPublish( "im_bored", "boolean" );
	sb.connection.onStringMessage = onString.bind(this);
	sb.connection.onOpen = onOpen.bind(this);
	sb.connection.onClose = onClose.bind(this);

	// connect to Spacebrew
	sb.connection.connect();
}

/**
 * onOpen sets the sb.connected flag to true
 * @return {none} 
 */
onOpen = function() {
	console.log("[sb.onopen] websockets connection opened, device name is: " + name);
	sb.connected = true;
}

/**
 * onClose Sets the sb.connected flat to false
 * @return {none} 
 */
onClose = function() {
    console.log("[sb.onclose] websockets connection closed");
	sb.connected = false;
}

/**
 * onString method that is used to process string messages received through spacebrew. It first checks whether 
 * 		the message received is a valid URL, if not then it stops processing the message; otherwise, it 
 * 		attempts to load that URL into the url launcher.
 * @param  {string} source name of the inlet where the message was received
 * @param  {string} string payload of the message that was received
 * @return {return}        nothing
 */
onString = function (source, string) {
	if (debug) console.log("[onString] sb message received from: " + source + " data: " + string);
	var expression = /[-a-zA-Z0-9@:%_\+.~#?&\/\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)?/gi;
	if ( !string.match(expression)) {
		if (debug) console.log("[onString] not a URL: ", string.match(expression));
		return;
	}

	if ( !(string.indexOf("http:\/\/") == 0) && !(string.indexOf("https:\/\/") == 0) ) {
		string = "http:\/\/" + string;
	}
	var query_start = "?";
	if (string.indexOf("?") >= 0) query_start = "&";
	content.url_active = string + query_start + "active=true" + content.qs_active;
	content.tab_handler.setActiveUrl(content.url_active);			
}

/**
 * prepQueryString method that builds the query string options based on the settings provided when the application
 * 		was launched, or re-activated.
 * @param {array} options Array of the different options that need to be propagate each time the page reloads.
 */
prepQueryString = function (options) {
	content.qs_active = "";
	for (i in content.qs_attrs) {
		if (options[content.qs_attrs[i]] != undefined) 
			content.qs_active += "&" + content.qs_attrs[i] + "=" + options[content.qs_attrs[i]];
	}
	if (debug) console.log("[readRequest] query string set " + content.qs_active);

}




