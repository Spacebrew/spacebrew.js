/*!
 *  Text Transform :: Main  *
 * 
 *  This app was designed to transform text messages from spacebrew. It listens 
 *  for incoming messages in one or all inlets. If an incoming message is matched 
 *  to a 'key' message, then the associated 'mapped' message is sent via one or all 
 *  outlets. Mapped messages can also be sent by pressing the "send me" button. 
 *
 * 	Take a look at the readme.md file in the parent directory for more information
 * 	about this spacebrew web app.
 *  
 *  <br />Copyright (C) 2012 LAB at Rockwell Group http://lab.rockwellgroup.com
 *
 * @filename    main.js
 * @author      Julio Terra (LAB at Rockwell Group) 
 * @modified    12/01/2012
 * @version     1.1.0
 * 
 */


// variables that holds all components of the app
var app = {};
	app.model = {};
	app.view = {};
	app.controller = {};
	app.debug = (window.getQueryString('debug') == "true") ? true : false;	

$(window).bind("load", function() {
	setup();
});

/**
 * setup Method that builds the model, view and app objects, and starts up the web app. This method
 * 		is called when the page is finished loading.
 * @return {none} 
 */
function setup (){
	if (app.debug) console.log("[main.js:setup] page loaded and debug logging is ON")

	// Set-up the application by initializing the Model, Video and Controller
	app.model = new Model.app();
	app.view = new View.app();
	app.controller = new Controller.app(app);
	app.controller.begin();
}