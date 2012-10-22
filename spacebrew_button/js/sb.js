/**
 * Utils
 */

if (!window['getQueryString']){
	/**
	 * Get parameters from a query string
	 * @param  {[type]} name 
	 * @return {[type]}      value of parameter (or empty string if not found)
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

var Spacebrew = Spacebrew || {};

/**
 * [Client description]
 * @param  {[type]} server      (Optional) Address of Spacebrew server. Checks "server" query string if not passed; defaults to localhost
 * @param  {[type]} name        (Optional) Name of app. Checks "name" query string if not passed; defaults to window.location.href
 * @param  {[type]} description (Optional) Description of app. Defaults to "";
 */
Spacebrew.Client = function( server, name, description ){
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
	this._name		 = name !== undefined ? name : (getQueryString('name') !== "" ? getQueryString('name') : window.location.href);
	this._description = description;
	this.config.name = this._name;
	this.config.description = this._description;
	this.server 	 = server !== undefined ? server : (getQueryString('server') !== "" ? getQueryString('server') : 'localhost');
	this.isConnected = false;
}

/**
 * [connect description]
 */
Spacebrew.Client.prototype.connect = function(){
	try {
		this.socket 	 		= new WebSocket("ws://"+this.server+":9000");
		this.socket.onopen 		= this._onOpen.bind(this);
		this.socket.onmessage 	= this._onMessage.bind(this);
		this.socket.onclose 	= this._onClose.bind(this);
		this.isConnected = true;
	} catch(e){
		this.isConnected = false;
	}
}

/**
 * [onRangeMessage description]
 * @param  {[type]} name  [description]
 * @param  {[type]} value [description]
 */
Spacebrew.Client.prototype.onRangeMessage = function( name, value ){}

/**
 * [onBooleanMessage description]
 * @param  {[type]} name  [description]
 * @param  {[type]} value [description]
 */
Spacebrew.Client.prototype.onBooleanMessage = function( name, value ){}

/**
 * [onStringMessage description]
 * @param  {[type]} name  [description]
 * @param  {[type]} value [description]
 */
Spacebrew.Client.prototype.onStringMessage = function( name, value ){}

/**
 * [addPublisher description]
 * @param {[type]} name [description]
 * @param {[type]} type [description]
 * @param {[type]} def  [description]
 */
Spacebrew.Client.prototype.addPublisher = function( name, type, def ){
	this.config.publish.messages.push({"name":name, "type":type, "default":def});
	this.updatePubSub();
}

/**
 * [addSubscriber description]
 * @param {[type]} name [description]
 * @param {[type]} type [description]
 */
Spacebrew.Client.prototype.addSubscriber = function( name, type ){
	this.config.subscribe.messages.push({"name":name, "type":type });
	this.updatePubSub();
}

/**
 * Update publishers and subscribers
 */
Spacebrew.Client.prototype.updatePubSub = function(){
	if (this.isConnected) this.socket.send(JSON.stringify({"config":this.config}));
}

/**
 * [send description]
 * @param  {[type]} name  [description]
 * @param  {[type]} type  [description]
 * @param  {[type]} value [description]
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
 * [onOpen description]
 * @private
 * @param  {[type]} argument [description]
 */
Spacebrew.Client.prototype._onOpen = function() {
    console.log("WebSockets connection opened");
    console.log("my name is: "+name);
    var nameMsg = { "name": [
    	{"name": name}
   	]};
	this.socket.send(JSON.stringify(nameMsg));

  	// send my config
  	this.updatePubSub();
}

/**
 * [onMessage description]
 * @private
 * @param  {[type]} data [description]
 */
Spacebrew.Client.prototype._onMessage = function( data ){
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
 * [onClose description]
 * @private
 */
Spacebrew.Client.prototype._onClose = function() {
    console.log("WebSockets connection closed");
	this.isConnected = false;
}

/**
 * @return {String} Client name
 */
Spacebrew.Client.prototype.__defineGetter__("name", function(){
    return this._name;
});

Spacebrew.Client.prototype.__defineSetter__("name", function(val){
    this._name = val;
	this.config.name = this._name;
});

/**
 * @return {String} Client description
 */
Spacebrew.Client.prototype.__defineGetter__("description", function(){
    return this._description;
});

Spacebrew.Client.prototype.__defineSetter__("description", function(val){
    this._description = val;
	this.config.description = this._description;
});

