// BIND FIX FOR OLDER BROWSERS
if( Function.prototype.bind ) {
} else {
	/** safari, why you no bind!? */
	Function.prototype.bind = function (bind) {
		var self = this;
		return function () {
			var args = Array.prototype.slice.call(arguments);
			return self.apply(bind || null, args);
		};
	};
}

/*!
 * \namespace ISjs
 * \brief An javascript library to connect to IS installation.
 * <br />Copyright (C) 2012 LAB at Rockwell Group http://lab.rockwellgroup.com
 *
 * @author      The Lab
 * @modified    06/02/2012
 * @version     1.0.0
 */

var ISjs = {}
/*! \class ISjs::Connection
	\brief Creates a new IS connection with host
*/

ISjs.Connection = function( framework ){
	this.bConnected	 = false
	this.framework = framework || ISjs.INTERACTIVE_SPACES;

	this.onConnectHooks		= [];
	this.onDisconnectHooks	= [];
	this.onMessageHooks		= [];
	this.onStartupHooks		= [];
	this.onActivateHooks	= [];
	this.onDeactivateHooks	= [];
	this.onShutdownHooks	= [];
};


/*! \fn ISjs::Connection::connect
 * \brief Setup IS connection
 * \memberof ISjs::Connection
 * \param host (optional) The I.S. backend that this application should connect to. Defaults to window.location.hostname. You must specify a host if you are connecting to a remote I.S. server.
 * \param port (optional)  The port on the host of the I.S. activity that this application should connect to. Defaults to window.location.port. You must specify a port if you change the port your local or remote I.S. server is running on.
 * \param channel (optional) The websocket channel that this application should use to connect to the host. Defalut to "/websocket"
 * 
 */

ISjs.Connection.prototype.connect = function( host, port, channel ) {
	this.host 		= host || window.location.hostname;
	this.port 		= port || window.location.port;
	this.channel	= channel || "/websocket";
	
	this.socket 			= new WebSocket("ws://"+this.host+":"+this.port+this.channel);
	this.socket._parent		= this;
	this.socket.onmessage 	= this.onWSMessage.bind(this);
	this.socket.onopen 		= this.onConnectionOpened.bind(this);
	this.socket.onclose 	= this.onConnectionClosed.bind(this);
};

/*!
 * \fn ISjs::Connection::sendMessage
 * \brief Send an IS message
 * \memberof ISjs::Connection
 * \param key The name of the route you are sending.
 * \param value the value you are sending
*/
ISjs.Connection.prototype.sendMessage = function( key, value ) {
	if (!this.bConnected){
		if (console) console.warn("Not connected!");
		return;
	}

	value['route'] = key;
	this.socket.send( JSON.stringify(value) );
};

/*!
 * \fn ISjs::Connection::onMessage
 * \brief Pass in a function to receive messages from IS
 * \memberof ISjs::Connection
 * \param fun function you would like to be called; must catch (key, value)
*/

ISjs.Connection.prototype.onMessage = function( fun ) {
	if ( typeof fun !== "function" ){
		console.warn( "method passed to ISjs.Connection.onMessage is not a function");
	} else {
		// DEV NOTE: SHOULD WE CHECK FOR DUPLICATES?
		this.onMessageHooks.push( fun );
	}
};

/*!
 * \fn ISjs::Connection::onConnect
 * \brief Pass in a function in your add a listener to "connect" events from IS.
 * \memberof ISjs::Connection
 * \param fun function you would like to be called
*/

ISjs.Connection.prototype.onConnect = function( fun ) {
	if ( typeof fun !== "function" ){
		console.warn( "method passed to ISjs.Connection.onConnect is not a function");
	} else {
		// DEV NOTE: SHOULD WE CHECK FOR DUPLICATES?
		this.onConnectHooks.push( fun );
	}
};

/*!
 * \fn ISjs::Connection::onDisconnect
 * \brief Pass in a function in your add a listener to "disconnect" events
 * \memberof ISjs::Connection
 * \param fun function you would like to be called
*/

ISjs.Connection.prototype.onDisconnect = function( fun ) {
	if ( typeof fun !== "function" ){
		console.warn( "method passed to ISjs.Connection.onDisconnect is not a function");
	} else {
		// DEV NOTE: SHOULD WE CHECK FOR DUPLICATES?
		this.onDisconnectHooks.push( fun );
	}
};

/*!
 * \fn ISjs::Connection::onStartup
 * \brief Pass in a function in your add a listener to "startup" events from Interactive Spaces.
 * \memberof ISjs::Connection
 * \param fun function you would like to be called
*/

ISjs.Connection.prototype.onStartup = function( fun ) {
	if ( typeof fun !== "function" ){
		console.warn( "method passed to ISjs.Connection.onStartup is not a function");
	} else {
		// DEV NOTE: SHOULD WE CHECK FOR DUPLICATES?
		this.onStartupHooks.push( fun );
	}
};

/*!
 * \fn ISjs::Connection::onActivate
 * \brief Pass in a function in your add a listener to "activate" events from Interactive Spaces.
 * \memberof ISjs::Connection
 * \param fun function you would like to be called
*/

ISjs.Connection.prototype.onActivate = function( fun ) {
	if ( typeof fun !== "function" ){
		console.warn( "method passed to ISjs.Connection.onActivate is not a function");
	} else {
		// DEV NOTE: SHOULD WE CHECK FOR DUPLICATES?
		this.onActivateHooks.push( fun );
	}
};

/*!
 * \fn ISjs::Connection::onDeactivate
 * \brief Pass in a function in your add a listener to "deactivate" events from Interactive Spaces.
 * \memberof ISjs::Connection
 * \param fun function you would like to be called
*/

ISjs.Connection.prototype.onDeactivate = function( fun ) {
	if ( typeof fun !== "function" ){
		console.warn( "method passed to ISjs.Connection.onDeactivate is not a function");
	} else {
		// DEV NOTE: SHOULD WE CHECK FOR DUPLICATES?
		this.onDeactivateHooks.push( fun );
	}
};

/*!
 * \fn ISjs::Connection::onShutdown
 * \brief Pass in a function in your add a listener to "shutdown" events from Interactive Spaces.
 * \memberof ISjs::Connection
 * \param fun function you would like to be called
*/

ISjs.Connection.prototype.onShutdown = function( fun ) {
	if ( typeof fun !== "function" ){
		console.warn( "method passed to ISjs.Connection.onShutdown is not a function");
	} else {
		// DEV NOTE: SHOULD WE CHECK FOR DUPLICATES?
		this.onShutdownHooks.push( fun );
	}
};

/*!
 * \fn ISjs::Connection::onConnectionOpened
 * \memberof ISjs::Connection
 * \private
*/
ISjs.Connection.prototype.onConnectionOpened = function() {
	this.bConnected = true;
	if (console) console.log("I.S. connected");

	//pass 'this' along in case connection is delegated by a separate class
	this.callAllFuncInArray(this.onConnectHooks, this);
};

/*!
 * \fn ISjs::Connection::onConnectionClosed
 * \memberof ISjs::Connection
 * \private
*/
ISjs.Connection.prototype.onConnectionClosed = function() {
	this.bConnected = false;
	this.callAllFuncInArray(this.onDisconnectHooks);
};

/*!
 * \fn ISjs::Connection::callAllFuncInArray
 * \brief A utility function to call every function in an array of functions without any arguments
 * \memberof ISjs::Connection
 * \private
*/
ISjs.Connection.prototype.callAllFuncInArray = function(array, arg){
	for(var i in array){
		//see ISjs.Connection.onConnectionOpened
		array[i](arg);
	};
};

/*!
 * \fn ISjs::Connection::onWSMessage
 * \memberof ISjs::Connection
 * \private
*/
ISjs.Connection.prototype.onWSMessage = function( evt ) {
	if (this.framework == ISjs.INTERACTIVE_SPACES){
		var dataObj = JSON.parse( evt.data );
		if (dataObj.route == "state"){
			switch (dataObj.data.state){
				case "startup":
					this.callAllFuncInArray(this.onStartupHooks);
					break;
				case "activate":
					this.callAllFuncInArray(this.onActivateHooks);
					break;
				case "deactivate":
					this.callAllFuncInArray(this.onDeactivateHooks);
					break;
				case "shutdown":
					this.callAllFuncInArray(this.onShutdownHooks);
					break;
				default:
					console.warn( "state passed via websocket is unexpected:");
					console.warn(dataObj);
					break;
			}
		} else {
			this.defaultMessageHandling(evt);	
		}
	} else {
		this.defaultMessageHandling(evt);
	}
};

/*!
 * \fn ISjs::Connection::defaultMessageHandling
 * \brief Handles the default functionality for onWSMessage
 * \memberof ISjs::Connection
 * \private
*/
ISjs.Connection.prototype.defaultMessageHandling = function(evt){
	var dataObj = JSON.parse( evt.data );
	if ( dataObj.route ) {
		for (var i=0; i<this.onMessageHooks.length; i++){
			this.onMessageHooks[i](dataObj.route, dataObj.data);
		};
	} else {
		for (var i=0; i<this.onMessageHooks.length; i++){
			this.onMessageHooks[i]( "route", dataObj );
		};
	}
}

/** @constant */
ISjs.INTERACTIVE_SPACES = "interactiveSpaces";