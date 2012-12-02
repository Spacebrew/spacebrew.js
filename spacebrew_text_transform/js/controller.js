/*!
 *  Text Transform :: Controller  *
 * 
 *  The controller class runs the text transform app. It manages the spacebrew connection, the 
 *  application view and model. 
 *  
 *  <br />Copyright (C) 2012 LAB at Rockwell Group http://lab.rockwellgroup.com
 *
 * @filename    controller.js
 * @author      Julio Terra from LAB at Rockwell Group
 * @modified    12/01/2012
 * @version     1.0.0
 * 
 */


/**
 * View Namespace for the Controller class
 * @type {Object}
 */
Controller = {}

/**
 * Controller.app Constructor method for the Controller.app class. It holds the core logic of the text
 * 		transform app. It sets up the connection to Spacebrew, interfaces with people through the
 * 		view, and keeps the data model up to date as the app runs. 
 * 		
 * @param  {Object} _config Object featuring the following attributes: (1) view: a link to the view
 *                          that serves as the user interface; (2) model: a link to the model where
 *                          the data for all transform maps, incoming messages, and channels are saved.
 * @return {Controller.app}	Returns an instance of the Controller.app class.         
 */
Controller.app = function (_config) {
	// read the query string options
	this.readQS(); 	

	// check if local storage is available on current browser
	if (Modernizr.localstorage) {
		this.storageAvail = true;
		this.storageKey += "_" + this.qs.name;
	} 

	// forward configs, if available
	if (_config) this.config(_config);
	if (this.debug) console.log("[Controller] calling constructor ");
},				

/**
 * Controller.app.prototype Class definition where all attributes and methods of the Controller.app class 
 *        are defined.
 * @type {Object}
 */
Controller.app.prototype = {
	constructor: Controller.app,	// holds link to constructor
	connection: {},					// holds spacebrew connection
	view: {},						// holds link to app view
	model: {},						// holds link to app model
	qs: {},							// holds query string options
	pubSubDefault: 5,  				// default number of outlets and inlets
	debug: false,					// flag that identifies if debug messages should be output

	/**
	 * config Method that configures the controller by linking it to the view and model, and setting
	 * 		debug logging on or off.
	 * @param  {Object} _config Object featuring the following attributes: (1) view: link to the app
	 *                          view; (2) model: link to the app model; (3) debug: flag that turns
	 *                          debug logging on and off.
	 */
	config: function(_config) {
		if (this.debug) console.log("[Controller:config] ", _config);

		// if _config parameter was provided then use it to initilize the view, model and debug logging
		if (_config) {
			this.view = _config["view"] || new View();
			this.model = _config["model"] || new Model.app();
			this.debug = (_config["debug"] == true) ? true : false;		
		}
	},

	/**
	 * readQS Method that reads query string options and initializes all qs variables.
	 */
	readQS: function() {
	    this.qs.href = window.location.href;
	    this.qs.name = window.getQueryString('name') || "SpaceTxtTransform" + (window.getQueryString('id') ? (" " + window.getQueryString('id')) : "");	// name of app in spacebrew
	    this.qs.server = window.getQueryString('server') || 'localhost';					    // name of spacebrew server
	    this.qs.debug = (window.getQueryString('debug') == "true") ? true : false;		// debug flag
	    this.qs.save = (window.getQueryString('save') == "false") ? false : true;		// debug flag
	    this.qs.inlets = parseInt(window.getQueryString('inlets')) || this.pubSubDefault;			// number of inlets
	    this.qs.outlets = parseInt(window.getQueryString('outlets')) || this.pubSubDefault;		// number of outlets
	},

	/**
	 * begin Method that is used to start-up the text transform app. It starts-up the connection to spacebrew,
	 * 		configures the app model and view, starts up the view, and then loads data from local storage, if
	 * 		available.
	 * @param  {Object} _config Object featuring the following attributes: (1) view: link to the app
	 *                          view; (2) model: link to the app model; (3) debug: flag that turns
	 *                          debug logging on and off.
	 */
	begin: function(_config) {
		if (_config) this.config(_config);

		// setup connection to spacebrew spacebrew
		if (this.debug) console.log("[Controller:begin] setting up connection to Spacebrew");
		this.view.updateStatus("attempting to connect to the spacebrew server.");
		var description = "A simple tool for transforming text messages in Spacebrew. It just responds to messages by sending other messages.";
		this.connection = new Spacebrew.Client(this.qs.server, this.qs.name, description);

		// configure spacebrew subscriptions and publications, and set-up arrays to configure model
		var subscriptions = [];
		for (i = 0; i < this.qs.inlets; i++) {
			var new_subscribe = "inlet_" + i;
			subscriptions.push( new Model.pubSubItem({ "name": new_subscribe, "type": "string" }) );
			this.connection.addSubscribe( new_subscribe, "string" );
		}
		var publications = [];
		for (i = 0; i < this.qs.outlets; i++) { 
			var new_publish = "outlet_" + i;
			publications.push( new Model.pubSubItem({ "name": new_publish, "type": "string" }) );
			this.connection.addPublish( new_publish, "string" );
		}

		// configure the model and view
		var params = { "name": this.qs.name, "subscribe": subscriptions, "publish": publications, "controller": this, "debug": this.qs.debug };
		this.model.config(params);
		this.view.config(params);

		// start-up the view
		this.view.begin();

		// load data from local storate if local storage is available
		var loaded = false;
		if (this.storageAvail) loaded = this.loadModel();

		// if no data has been loaded then create an empty transform map entry
		if (!loaded) this.addTransform();		

		// register Spacebrew events handlers
		this.connection.onStringMessage = this.onString.bind(this);
		this.connection.onOpen = this.onOpen.bind(this);
		this.connection.onClose = this.onClose.bind(this);

		// connect to spacebrew
		this.connection.connect();
		if (this.debug) console.log("[Controller:begin] model " + this.model.stringify());
	},

	/**
	 * addTransform Method that adds new transform maps to the content list. Method can be called with an
	 * 		argument with data to initialize the new transform map, or can be called without an argument, 
	 * 		in which case a blank transform map will be created.	
	 * @param  {Object} _incomingMsg Holds data is used to create a new transform map. If the variable is a 
	 *                  string then this string will be used as the "key" string of the new
	 *                  transform map. If the variable is an object then it should contain one or
	 *                  more of the following attributes: 
	 *                  	(1) message: used to set the incoming message component of the transform map; 
	 *                   	(2) source: used to set the inlet component of the transform map; 
	 *                    	(3) incoming: used to set the incoming message component of the transform map; 
	 *                     	(4) inlet: used to set the inlet component of the transform map; 
	 *                      (5) outgoing: used to set the outgoing message component of the transform map; 
	 *                      (6) outlet: used to set the outlet component of the transform map. 
	 */
	addTransform: function (_incomingMsg) {
		// if model is available then process the add request
		if (this.model.transforms) {
			if (this.debug) console.log("[Controller:addTransform] preprocessed model.transforms.maps", JSON.stringify(this.model.transforms.maps));

			// process incoming message to see if features appropriate data type and/or attributes
			var processedMsg = {};
			if (_incomingMsg) {
				if (typeof _incomingMsg == 'string') processedMsg["incoming"] = _incomingMsg;
				else {
					if (_incomingMsg["message"]) processedMsg["incoming"] = _incomingMsg["message"];
					if (_incomingMsg["source"]) processedMsg["inlet"] = _incomingMsg["source"];

					if (_incomingMsg["incoming"]) processedMsg["incoming"] = _incomingMsg["incoming"];
					if (_incomingMsg["inlet"]) processedMsg["inlet"] = _incomingMsg["inlet"];
					if (_incomingMsg["outgoing"]) processedMsg["outgoing"] = _incomingMsg["outgoing"];
					if (_incomingMsg["outlet"]) processedMsg["outlet"] = _incomingMsg["outlet"];
				} 
			} 
			else {
				processedMsg["incoming"] = "";
			}

			// set-up id for the new transform map, then create map and add it to model
			var newEleId = "map-" + this.model.transforms.curId;
			this.model.transforms.maps[newEleId] = new Model.transform (processedMsg);
			this.model.transforms.curId += 1;	

			// save updated model
			// this.save();
			this.saveModel();
			if (this.debug) console.log("[Controller:addTransform] updated this.model.transforms.maps", JSON.stringify(this.model.transforms.maps));

			// update transform list view
			if (this.view.initialized) this.view.updateTransformList();
		} 

		// if this.model.transforms is not loaded then print error message
		else {			
			console.log("[Controller:addTransform] model.transforms not loaded, can't add transform map");
		}
	},	

	/**
	 * addIncoming Method that adds new incoming messages to the incoming message list. 	
	 * @param {String} _inletName   Holds the name of the inlet (or subscription channel) on which the
	 *                              message was received.
	 * @param {String} _incomingMsg Holds the text of the message that was received.
	 */
	addIncoming: function (_inletName, _incomingMsg) {
		// if model is available then process the add request
		if (this.model.incoming) {
			if (this.debug) console.log("[Controller:addIncoming] transforming message: ", _incomingMsg);                         

			// rearrange existing array to add new item if it is already at max length
			if (this.model.incoming.msgs.length >= this.model.incoming.maxLength) {
				for (var i = this.model.incoming.maxLength; i > 0; i-- ) {
					var indexTo = (this.model.incoming.msgs.length - i);
					var indexFrom = (this.model.incoming.maxLength - i) + 1;
					this.model.incoming.msgs[indexTo] = this.model.incoming.msgs[indexFrom];           
				}
				this.model.incoming.msgs[this.model.incoming.maxLength-1] = new Model.incomingMsg({"source": _inletName, "message": _incomingMsg});        
			} 

			// add new element to array if array is shorter then max length
			else {
				var newIncoming = {"source": _inletName, "message": _incomingMsg};
				this.model.incoming.msgs.push(new Model.incomingMsg(newIncoming));
				if (this.debug) console.log("[Controller:addIncoming] adding to model: ", newIncoming);                         
			}	

			// save the updated data model
			this.saveModel();
			// this.save();

			// update the incoming message list view
			this.view.updateIncomingList();

			if (this.debug) console.log("[Controller:addIncoming] updated this.model.incoming: ", this.model.incoming);                         
		}

		// if this.model.incoming is not loaded then print error message
		else {
			console.log("[Controller:addIncoming] this.model.incoming not loaded, can't add incoming message");
		}
	},

	/**
	 * map Method that checks if an incoming message is a key for a transform map. If it finds a map key then
	 * 		it sends out the appropriate mapped message via the sendMsg method.
	 * @param  {String} _inletName   Holds the name of the inlet / subscription channel where the message 
	 *                               was received
	 * @param  {String} _incomingMsg Holds the message itself
	 */
	map: function(_inletName, _incomingMsg) {
		// check the txtTranforms obj to determine if this message is being transformed and routed messages
		for(var i in this.model.transforms.maps) {

			// make sure the current transform accepts messages from this inlet
			if (this.model.transforms.maps[i]["inlet"].indexOf(_inletName) == 0 || 
				this.model.transforms.maps[i]["inlet"].indexOf("all_inlets") == 0) {
				if (this.debug) console.log( "[Controller:map] matched inlet: " + this.model.transforms.maps[i]["inlet"] + " with " + _inletName);                         

				// check if the current txtTransform message equals the incoming spacebrew message  
				if (this.model.transforms.maps[i]["incoming"].indexOf(_incomingMsg) == 0 && _incomingMsg.length > 0) {
					this.sendMsg(i);
					if (this.debug) console.log("[Controller:map] sending mapped message: ", this.model.transforms.maps[i]["outgoing"]);                         
				}
			}
		}        

	},

	/**
	 * deleteTransform Method that deletes a transform map from the data model.
	 * @param  {String} delEleId Holds the id of the transform map element that will be deleted
	 */
	deleteTransform: function(delEleId) {
		if (this.debug) console.log("[Controller:deleteTransform] " + delEleId);                         
		if (this.model.transforms.maps[delEleId]) delete this.model.transforms.maps[delEleId];
	},


	/**
	 * save Method that saves the data model to the local storage. It first checks to confirm that
	 * 		the browser supports this functionality.
	 */
	saveModel: function() {
		this.model.save();
	},

	/**
	 * load Method that loads a data model from the local storage, if it is avaialble. The "key" that it uses
	 * 		is a combination of the default storageKey and the spacebrew app name.
	 * @return {Boolean} Returns true if a data model was found and loaded, returns false if the data
	 *                           model was not found.
	 */
	loadModel: function() {
		var success = this.model.load();
		this.view.update();
		return success;
	},

	/**
	 * onOpen Method that is called when spacebrew connection is openned. It makes the app visible, 
	 * 		and hides the status messages.
	 */
	onOpen: function() {
		if (this.debug) console.log("[Controller:onOpen]");                         
		if (this.view) {
			this.view.showApp();
			this.view.updateStatus("Spacebrew connection established");
		}
	},

	/**
	 * onClose Method that is called when spacebrew connection is closed. It hides the app and 
	 * 		and displays the status messages.
	 */
	onClose: function() {
		if (this.debug) console.log("[Controller:onClose]");                         
		if (this.view) {
			this.view.showStatus();
			var newString = "Connection attempt failed or spacebrew server no longer available at '" + qs.server + "'\n\n" +
			                "Please reload the page and make sure that you've specified the correct spacebrew server address. ";
			if (!window.getQueryString('server')) {
				var conn = "?";
				if (qs.href.indexOf("?") != -1) conn = "&";    
				newString = newString + "This is how you can specify the server address in the webapp url (" +
				                        "just replace 'server_address' with the Spacebrew server's address):\n\n" + 
				                        qs.href + conn + "server=server_address&"             
			}
			this.view.updateStatus(newString);
		}
	},

	/**
	 * onString Method that handles string messages received via spacebrew. To process each message it
	 * 		first calls the map() method, which checks if the message that was just received is a transform
	 * 		map key, and then it calls addIncoming() method, which adds the message the incoming message array.	
	 * @param  {String} inletName Holds the name of the inlet / subscription channel where the incoming
	 *                            message was received
	 * @param  {String} msg       Holds the text message that was received
	 */
	onString: function (inletName, msg) {
		if (this.debug) console.log("[Controller:onString]");                         
		this.map(inletName, msg);
		this.addIncoming(inletName, msg);
	},

	/**
	 * sendMsg Sends mapped message from a transform map. It first checks the transform map to confirm
	 * 		which outlets / publication channels should be used.
	 * @param  {string} id Holds the transform maps hashlist id of the message that is being sent
	 */
	sendMsg: function(id) {
		// if message is routed to all outlets then customize and send them
		if (this.model.transforms.maps[id]["outlet"].indexOf("all_outlets") == 0) {
			if (this.debug) console.log( "[sendMsg] this.model.channels.publish: ", JSON.stringify(this.model.channels.publish));
			if (this.model.channels.publish) {
				for (var item in this.model.channels.publish) {
					if (this.debug) console.log( "[sendMsg] one obj at a time - name: " + this.model.channels.publish[item]["name"] + 
											" type: " + this.model.channels.publish[item]["type"] +
											" val: " + this.model.transforms.maps[id]["outgoing"]);                         
					this.connection.send(this.model.channels.publish[item]["name"], this.model.channels.publish[item]["type"], this.model.transforms.maps[id]["outgoing"]);            					
				}
			} 
		}
		// otherwise just send the message to the single appropriate outlet
		else {
			if (this.debug) console.log( "[sendMsg] sending to one outlet: ", this.model.transforms.maps[id]["outlet"] );                         
			this.connection.send(this.model.transforms.maps[id]["outlet"], "string", this.model.transforms.maps[id]["outgoing"]);            
		}
	}
}