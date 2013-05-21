/**
 * 
 * Spacebrew Library for Javascript
 * --------------------------------
 *  
 * This library was designed to work on front-end (browser) envrionments, and back-end (server) 
 * environments. Please refer to the readme file, the documentation and examples to learn how to 
 * use this library.
 * 
 * Spacebrew is an open, dynamically re-routable software toolkit for choreographing interactive 
 * spaces. Or, in other words, a simple way to connect interactive things to one another. Learn 
 * more about Spacebrew here: http://docs.spacebrew.cc/
 *
 * To import into your web apps, we recommend using the minimized version of this library.
 *
 * Latest Updates:
 * - added blank "options" attribute to config message - for future use 
 * - caps number of messages sent to 60 per second
 * - reconnect to spacebrew if connection lost
 * - enable client apps to extend libs with admin functionality.
 * - added close method to close Spacebrew connection.
 * 
 * @author 		Brett Renfer and Julio Terra from LAB @ Rockwell Group
 * @filename	sb-1.3.0.js
 * @version 	1.3.0
 * @date 		May 7, 2013
 * 
 */

/**
 * Check if Bind method exists in current enviroment. If not, it creates an implementation of
 * this useful method.
 */
if (!Function.prototype.bind) {  
  Function.prototype.bind = function (oThis) {  
	if (typeof this !== "function") {  
	  // closest thing possible to the ECMAScript 5 internal IsCallable function  
	  throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");  
	} 
  
	var aArgs = Array.prototype.slice.call(arguments, 1),   
		fToBind = this,   
		fNOP = function () {},  
		fBound = function () {  
		  return fToBind.apply(this instanceof fNOP  
								 ? this  
								 : oThis || window,  
							    aArgs.concat(Array.prototype.slice.call(arguments)));  
		};  
  
	fNOP.prototype = this.prototype;  
	fBound.prototype = new fNOP();  
  
	return fBound;  
  };  
} 

/**
 * @namespace for Spacebrew library
 */
var Spacebrew = Spacebrew || {};

/**
 * create placeholder var for WebSocket object, if it does not already exist
 */
var WebSocket = WebSocket || {};


/**
 * Check if Running in Browser or Server (Node) Environment * 
 */

// check if window object already exists to determine if running browswer
var window = window || undefined;

// check if module object already exists to determine if this is a node application
var module = module || undefined;

// if app is running in a browser, then define the getQueryString method
if (window) {
	if (!window['getQueryString']){
		/**
		 * Get parameters from a query string
		 * @param  {String} name Name of query string to parse (w/o '?' or '&')
		 * @return {String}	value of parameter (or empty string if not found)
		 */
		window.getQueryString = function( name ) {
			if (!window.location) return;
			name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
			var regexS = "[\\?&]"+name+"=([^&#]*)";
			var regex = new RegExp( regexS );
			var results = regex.exec( window.location.href );
			if( results == null ) return "";
			else return results[1];
		}
	}	
}

// if app is running in a node server environment then package Spacebrew library as a module.
// 		WebSocket module (ws) needs to be saved in a node_modules so that it can be imported.
if (!window && module) {
	WebSocket = require("ws");
	module.exports = {
		Spacebrew: Spacebrew
	} 
}


/**
 * Define the Spacebrew Library * 
 */

/**
 * Spacebrew client!
 * @constructor
 * @param  {String} server      (Optional) Base address of Spacebrew server. This server address is overwritten if server defined in query string; defaults to localhost.
 * @param  {String} name        (Optional) Base name of app. Base name is overwritten if "name" is defined in query string; defaults to window.location.href.
 * @param  {String} description (Optional) Base description of app. Description name is overwritten if "description" is defined in query string;
 * @param  {Object} options		(Optional) An object that holds the optional parameters described below
 *         			port 		(Optional) Port number for the Spacebrew server
 *            		admin 		(Optional) Flag that identifies when app should register for admin privileges with server
 *              	debug 		(Optional) Debug flag that turns on info and debug messaging (limited use)
 */
Spacebrew.Client = function( server, name, description, options ){

	var options = options || {};

	// check if the server variable is an object that holds all config values
	if (server != undefined) {
		if (toString.call(server) !== '[object String]') {
			options.port = server.port || undefined;
			options.debug = server.debug || false;
			options.reconnect = server.reconnect || false;
			description = server.description || undefined;
			name = server.name || undefined;
			server = server.server || undefined;
		}	
	}

	this.debug = (window.getQueryString('debug') === "true" ? true : (options.debug || false));
	this.reconnect = options.reconnect || true;
	this.reconnect_timer = undefined;

	this.send_interval = 16;
	this.send_blocked = false;
	this.msg = {};

	/**
	 * Name of app
	 * @type {String}
	 */
	this._name = name || "javascript client #";
	if (window) {
		this._name = (window.getQueryString('name') !== "" ? unescape(window.getQueryString('name')) : this._name);
	}
	
	/**
	 * Description of your app
	 * @type {String}
	 */
	this._description = description || "spacebrew javascript client";
	if (window) {
		this._description = (window.getQueryString('description') !== "" ? unescape(window.getQueryString('description')) : this._description);
	}

	/**
	 * Spacebrew server to which the app will connect
	 * @type {String}
	 */
	this.server = server || "sandbox.spacebrew.cc";
	if (window) {
		this.server = (window.getQueryString('server') !== "" ? unescape(window.getQueryString('server')) : this.server);
	}

	/**
	 * Port number on which Spacebrew server is running
	 * @type {Integer}
	 */
	this.port = options.port || 9000;
	if (window) {
		port = window.getQueryString('port');
		if (port !== "" && !isNaN(port)) { 
			this.port = port; 
		} 
	}

	/**
	 * Reference to WebSocket
	 * @type {WebSocket}
	 */
	this.socket = null;

	/**
	 * Configuration file for Spacebrew
	 * @type {Object}
	 */
	this.client_config = {
		name: this._name,
		description: this._description,
		publish:{
			messages:[]
		},
		subscribe:{
			messages:[]
		},
		options:{}
	};

	this.admin = {}

	/**
	 * Are we connected to a Spacebrew server?
	 * @type {Boolean}
	 */
	this._isConnected = false;
}

/**
 * Connect to Spacebrew 
 * @memberOf Spacebrew.Client
 */
Spacebrew.Client.prototype.connect = function(){
	try {
		this.socket 	 		= new WebSocket("ws://" + this.server + ":" + this.port);
		this.socket.onopen 		= this._onOpen.bind(this);
		this.socket.onmessage 	= this._onMessage.bind(this);
		this.socket.onclose 	= this._onClose.bind(this);

	} catch(e){
		this._isConnected = false;
		console.log("[connect:Spacebrew] connection attempt failed")
	}
}

/**
 * Close Spacebrew connection
 * @memberOf Spacebrew.Client
 */
Spacebrew.Client.prototype.close = function(){
	try {
		if (this._isConnected) {
			this.socket.close();
			this._isConnected = false;
			console.log("[close:Spacebrew] closing websocket connection")
		}		
	} catch (e) {		
		this._isConnected = false;
	}
}

/**
 * Override in your app to receive on open event for connection
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.onOpen = function( name, value ){}


/**
 * Override in your app to receive on close event for connection
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.onClose = function( name, value ){}

/**
 * Override in your app to receive "range" messages, e.g. sb.onRangeMessage = yourRangeFunction
 * @param  {String} name  Name of incoming route
 * @param  {String} value [description]
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.onRangeMessage = function( name, value ){}

/**
 * Override in your app to receive "boolean" messages, e.g. sb.onBooleanMessage = yourBoolFunction
 * @param  {String} name  Name of incoming route
 * @param  {String} value [description]
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.onBooleanMessage = function( name, value ){}

/**
 * Override in your app to receive "string" messages, e.g. sb.onStringMessage = yourStringFunction
 * @param  {String} name  Name of incoming route
 * @param  {String} value [description]
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.onStringMessage = function( name, value ){}

/**
 * Override in your app to receive "custom" messages, e.g. sb.onCustomMessage = yourStringFunction
 * @param  {String} name  Name of incoming route
 * @param  {String} value [description]
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.onCustomMessage = function( name, value, type ){}


/**
 * Add a route you are publishing on 
 * @param {String} name Name of incoming route
 * @param {String} type "boolean", "range", or "string"
 * @param {String} def  default value
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.addPublish = function( name, type, def ){
	this.client_config.publish.messages.push({"name":name, "type":type, "default":def});
	this.updatePubSub();
}

/**
 * [addSubscriber description]
 * @param {String} name Name of outgoing route
 * @param {String} type "boolean", "range", or "string"
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.addSubscribe = function( name, type ){
	this.client_config.subscribe.messages.push({"name":name, "type":type });
	this.updatePubSub();
}

/**
 * Update publishers and subscribers
 * @memberOf Spacebrew.Client
 * @private
 */
Spacebrew.Client.prototype.updatePubSub = function(){
	if (this._isConnected) {
		this.socket.send(JSON.stringify({"config": this.client_config}));
	}
}

/**
 * Send a route to Spacebrew
 * @param  {String} name  Name of outgoing route (must match something in addPublish)
 * @param  {String} type  "boolean", "range", or "string"
 * @param  {String} value Value to send
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.send = function( name, type, value ){
	var self = this;

	this.msg = {
		"message": {
           "clientName":this._name,
           "name": name,
           "type": type,
           "value": value
       }
	}

   	// if send block is not active then send message
   	if (!this.send_blocked) {
	   	this.socket.send(JSON.stringify(this.msg));
		this.send_blocked = true;
		this.msg = undefined;

		// set the timer to unblock message sending
		setTimeout(function() {
			self.send_blocked = false;  	// remove send block			
			if (self.msg != undefined) {  	// if message exists then sent it
				self.send(self.msg.message.name, self.msg.message.type, self.msg.message.value);
			}
		}, self.send_interval);
   	} 
}

/**
 * Called on WebSocket open
 * @private
 * @memberOf Spacebrew.Client
 */
Spacebrew.Client.prototype._onOpen = function() {
    console.log("[_onOpen:Spacebrew] Spacebrew connection opened, client name is: " + this._name);

	this._isConnected = true;
	if (this.admin.active) this.connectAdmin();

	// if reconnect functionality is activated then clear interval timer when connection succeeds
	if (this.reconnect_timer) {
		console.log("[_onOpen:Spacebrew] tearing down reconnect timer")
		this.reconnect_timer = clearInterval(this.reconnect_timer);
		this.reconnect_timer = undefined;
	}

  	// send my config
  	this.updatePubSub();
  	this.onOpen();
}

/**
 * Called on WebSocket message
 * @private
 * @param  {Object} e
 * @memberOf Spacebrew.Client
 */
Spacebrew.Client.prototype._onMessage = function( e ){
	var data = JSON.parse(e.data)
		, name
		, type
		, value
		;

	// handle client messages 
	if (data["message"]) {
		// check to make sure that this is not an admin message
		if (!data.message["clientName"]) {
			name = data.message.name;
		    type = data.message.type;
			value = data.message.value;

			switch( type ){
				case "boolean":
					this.onBooleanMessage( name, value == "true" );
					break;
				case "string":
					this.onStringMessage( name, value );
					break;
				case "range":
					this.onRangeMessage( name, Number(value) );
					break;
				default:
					this.onCustomMessage( name, value, type );
			}			
		}
	} 

	// handle admin messages
	else {
		if (this.admin.active) {
			this._handleAdminMessages( data );		
		}
	}
}

/**
 * Called on WebSocket close
 * @private
 * @memberOf Spacebrew.Client
 */
Spacebrew.Client.prototype._onClose = function() {
	var self = this;
    console.log("[_onClose:Spacebrew] Spacebrew connection closed");

	this._isConnected = false;
	if (this.admin.active) this.admin.remoteAddress = undefined;

	// if reconnect functionality is activated set interval timer if connection dies
	if (this.reconnect && !this.reconnect_timer) {
		console.log("[_onClose:Spacebrew] setting up reconnect timer");
		this.reconnect_timer = setInterval(function () {
				if (self.isConnected != false) {
					self.connect();
					console.log("[reconnect:Spacebrew] attempting to reconnect to spacebrew");
				}
			}, 5000);
	}


	this.onClose();
};

/**
 * name Method that sets or gets the spacebrew app name. If parameter is provided then it sets the name, otherwise
 * 		it just returns the current app name.
 * @param  {String} newName New name of the spacebrew app
 * @return {String} Returns the name of the spacebrew app if called as a getter function. If called as a 
 *                  setter function it will return false if the method is called after connecting to spacebrew, 
 *                  because the name must be configured before connection is made.
 */
Spacebrew.Client.prototype.name = function (newName){
	if (newName) {								// if a name has been passed in then update it
		if (this._isConnected) return false;  	// if already connected we can't update name
		this._name = newName;	
		if (window) {
			this._name = (window.getQueryString('name') !== "" ? unescape(window.getQueryString('name')) : this._name);
		}
		this.client_config.name = this._name;			// update spacebrew config file
	} 	
	return this._name;	
};

/**
 * name Method that sets or gets the spacebrew app description. If parameter is provided then it sets the description, 
 * 		otherwise it just returns the current app description.
 * @param  {String} newDesc New description of the spacebrew app
 * @return {String} Returns the description of the spacebrew app if called as a getter function. If called as a 
 *                  setter function it will return false if the method is called after connecting to spacebrew, 
 *                  because the description must be configured before connection is made.
 */
Spacebrew.Client.prototype.description = function (newDesc){
	if (newDesc) {								// if a description has been passed in then update it
		if (this._isConnected) return false;  	// if already connected we can't update description
		this._description = newDesc || "spacebrew javascript client";
		if (window) {
			this._description = (window.getQueryString('description') !== "" ? unescape(window.getQueryString('description')) : this._description);
		}
		this.client_config.description = this._description;	// update spacebrew config file
	} 
	return this._description;	
};

/**
 * isConnected Method that returns current connection state of the spacebrew client.
 * @return {Boolean} Returns true if currently connected to Spacebrew
 */
Spacebrew.Client.prototype.isConnected = function (){
	return this._isConnected;	
};


Spacebrew.Client.prototype.extend = function ( mixin ) {    
    for (var prop in mixin) {
        if (mixin.hasOwnProperty(prop)) {
            this[prop] = mixin[prop];
        }
    }
};

