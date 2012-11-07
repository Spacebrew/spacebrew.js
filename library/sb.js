/**
 * Utils
 */

// add bind method for browsers that don't currently support it (such as Safari)
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

if (!window['getQueryString']){
	/**
	 * Get parameters from a query string
	 * @param  {String} name Name of query string to parse (w/o '?' or '&')
	 * @return {String}	value of parameter (or empty string if not found)
	 */
	window.getQueryString = function( name ) {
	  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	  var regexS = "[\\?&]"+name+"=([^&#]*)";
	  var regex = new RegExp( regexS );
	  var results = regex.exec( window.location.href );
	  if( results == null )
	    return "";
	  else
	    return results[1];
	}
}

/**
 * @namespace
 */
var Spacebrew = Spacebrew || {};

/**
 * Spacebrew client!
 * @constructor
 * @param  {String} server      (Optional) Address of Spacebrew server. Checks "server" query string if not passed; defaults to localhost
 * @param  {String} name        (Optional) Name of app. Checks "name" query string if not passed; defaults to window.location.href
 * @param  {String} description (Optional) Description of app. Defaults to "";
 */
Spacebrew.Client = function( server, name, description ){
	/**
	 * Reference to WebSocket
	 * @type {WebSocket}
	 */
	this.socket 	 = null;
	this.config		 = {
		name:this.name,
		description:this.description,
		publish:{
			messages:[]
		},
		subscribe:{
			messages:[]
		}
	};
	/**
	 * Name of app
	 * @type {String}
	 */
	this.name		 = name !== undefined ? name : (getQueryString('name') !== "" ? getQueryString('name') : window.location.href);
	
	/**
	 * Description of your app
	 * @type {String}
	 */
	this.description = description;
	this.server 	 = server !== undefined ? server : (getQueryString('server') !== "" ? getQueryString('server') : 'localhost');
	
	/**
	 * Are we connected to a Spacebrew server?
	 * @type {Boolean}
	 */
	
	// this._isConnected is internal, this.isConnected returns reference to it
	// works sort of like a read-only var...
	this._isConnected = false;
}

/**
 * Connect to Spacebrew 
 * @memberOf Spacebrew.Client
 */
Spacebrew.Client.prototype.connect = function(){
	try {
		this.socket 	 		= new WebSocket("ws://"+this.server+":9000");
		this.socket.onopen 		= this._onOpen.bind(this);
		this.socket.onmessage 	= this._onMessage.bind(this);
		this.socket.onclose 	= this._onClose.bind(this);
		this._isConnected = true;
	} catch(e){
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
 * Add a route you are publishing on 
 * @param {String} name Name of incoming route
 * @param {String} type "boolean", "range", or "string"
 * @param {String} def  default value
 * @memberOf Spacebrew.Client
 * @public
 */
Spacebrew.Client.prototype.addPublish = function( name, type, def ){
	this.config.publish.messages.push({"name":name, "type":type, "default":def});
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
	this.config.subscribe.messages.push({"name":name, "type":type });
	this.updatePubSub();
}

/**
 * Update publishers and subscribers
 * @memberOf Spacebrew.Client
 * @private
 */
Spacebrew.Client.prototype.updatePubSub = function(){
	if (this._isConnected) this.socket.send(JSON.stringify({"config":this.config}));
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
	var message = {
		message:{
           clientName:this.name,
           name:name,
           type:type,
           value:value
       }
   	};

   	//console.log(message);
   	this.socket.send(JSON.stringify(message));
}

/**
 * Called on WebSocket open
 * @private
 * @memberOf Spacebrew.Client
 */
Spacebrew.Client.prototype._onOpen = function() {
    console.log("WebSockets connection opened");
    console.log("my name is: "+this.name);

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
	// parse message and call callbacks
	var name = JSON.parse(e.data).message.name;
    var type = JSON.parse(e.data).message.type;
	var value = JSON.parse(e.data).message.value;

	switch( type ){
		case "boolean":
			this.onBooleanMessage( name, Boolean(value) );
			break;
		case "string":
			this.onStringMessage( name, value );
			break;
		case "range":
			this.onRangeMessage( name, Number(value) );
			break;
	}
}

/**
 * Called on WebSocket close
 * @private
 * @memberOf Spacebrew.Client
 */
Spacebrew.Client.prototype._onClose = function() {
    console.log("WebSockets connection closed");
	this._isConnected = false;
	this.onClose();
}
Spacebrew.Client.prototype.__defineGetter__("name", function(){
    return this._name;
});

Spacebrew.Client.prototype.__defineSetter__("name", function(val){
    this._name = val;
	this.config.name = this._name;
});

Spacebrew.Client.prototype.__defineGetter__("isConnected", function(){
    return this._isConnected;
});

Spacebrew.Client.prototype.__defineGetter__("description", function(){
    return this._description;
});

Spacebrew.Client.prototype.__defineSetter__("description", function(val){
    this._description = val;
	this.config.description = this._description;
});

