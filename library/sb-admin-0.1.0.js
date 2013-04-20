/**
 * Spacebrew Admin Mixin for Javascript
 * --------------------------------
 *
 * This is an admin client mixim for the Spacebrew library. By passing the Spacebrew.Admin
 * object into the Spacebrew.Client library's extend() method your client application will also
 * connect to Spacebrew as an admin tool.
 *
 * Spacebrew is an open, dynamically re-routable software toolkit for choreographing interactive 
 * spaces. Or, in other words, a simple way to connect interactive things to one another. Learn 
 * more about Spacebrew here: http://docs.spacebrew.cc/
 *
 * Please note that this library only works will the Spacebrew.js library sb-1.0.4.min.js and 
 * above.
 *
 * Latest Updates:
 * - enable client apps to be extended to include admin privileges.
 * - added methods to handle admin messages and to update routes.
 * 
 * @author 		Julio Terra
 * @filename	sb-admin-0.1.1.js
 * @version 	0.1.1
 * @date 		April 8, 2013
 * 
 */

Spacebrew.Admin = {}

Spacebrew.Admin.admin = {
		config: { 
			admin: true 
			, no_msgs: true
		} 
		, active: true
		, remoteAddress: undefined
		, clients: []
		, routes: []
	}

Spacebrew.Admin.connectAdmin = function () {
	this.socket.send(JSON.stringify(this.admin.config));	
}

/**
 * Override in your app to receive new client information, e.g. sb.onNewClient = yourFunction
 * Admin-related method.
 * 
 * @param {Object} client  			Object with client config details described below
 *        {String} name  			Name of client
 *        {String} address 			IP address of client
 *        {String} description 		Description of client
 *        {Array} publish 			Array with all publish data feeds for client
 *        {Array} subscribe  		Array with subscribe data feeds for client
 * @memberOf Spacebrew.Admin
 * @public
 */
// Spacebrew.Admin.onNewClient = function( name, address, description, pubs, subs ){}
Spacebrew.Admin.onNewClient = function( client ){}

/**
 * Override in your app to receive updated information about existing client, e.g. sb.onNewClient = yourFunction
 * Admin-related method.
 * 
 * @param {Object} client  			Object with client config details described below
 *        {String} name  			Name of client
 *        {String} address 			IP address of client
 *        {String} description 		Description of client
 *        {Array} publish 			Array with all publish data feeds for client
 *        {Array} subscribe  		Array with subscribe data feeds for client
 * @memberOf Spacebrew.Admin
 * @public
 */
// Spacebrew.Admin.onUpdateClient = function( name, address, description, pubs, subs ){}
Spacebrew.Admin.onUpdateClient = function( client ){}

/**
 * Override in your app to receive information about new routes, e.g. sb.onNewRoute = yourStringFunction
 * Admin-related method.
 * 
 * @param  {String} type 			Type of route message, either add or remove
 * @param  {Object} pub 			Object with name of client name and address, publish name and type
 * @param  {Object} sub 			Object with name of client name and address, subscribe name and type
 * @memberOf Spacebrew.Admin
 * @public
 */
Spacebrew.Admin.onUpdateRoute = function( type, pub, sub ){}

/**
 * Override in your app to receive client removal messages, e.g. sb.onCustomMessage = yourStringFunction
 * Admin-related method.
 * 
 * @param  {String} name  		Name of client being removed
 * @param  {String} address  	Address of client being removed
 * @memberOf Spacebrew.Admin
 * @public
 */
Spacebrew.Admin.onRemoveClient = function( name, address ){}


Spacebrew.Admin._handleAdminMessages = function( data ){
	if (true) console.log("[_handleAdminMessages] new message receive ", data);
	
	if (data["admin"]) {
		// nothing to be done
	}

	else if (data["remove"]) {
		if (this.debug) console.log("[_handleAdminMessages] remove client message ", data["remove"]);
		for (var i = 0; i < data.remove.length; i ++) {
			this.onRemoveClient( data.remove[i].name, data.remove[i].remoteAddress );
		}			
	}

	else if (data["route"]) {
		// if (this.debug) console.log("[_handleAdminMessages] route update message ", data["route"]);
		this.onUpdateRoute( data.route.type, data.route.publisher, data.route.subscriber );
	} 

	else if (data instanceof Array || data["config"]) {
		if (true) console.log("[_handleAdminMessages] handle client config message(s) ", data);
		if (data["config"]) data = [data];
		for (var i = 0; i < data.length; i ++) {
			if (data[i]["config"]) {
				this._onNewClient(data[i].config);
			} 
		}
	}	
}



/**
 * Called when a new client message is received. Only used when app is registered as
 * an admin application.
 * 
 * @param  {object} client 	Configuration information for new client, including name,
 *                          address, description, subscribe, and publishers
 * @private
 */
Spacebrew.Admin._onNewClient = function( client ){
	var existing_client = false;

	this._setLocalIPAddress( client );

	for( var j = 0; j < this.admin.clients.length; j++ ){
		console.log("existing client logged on " + client.name + " address " + client.remoteAddress);				

		if ( this.admin.clients[j].name === client.name
			 && this.admin.clients[j].remoteAddress === client.remoteAddress ) {

			existing_client = true;

			this.admin.clients[j].publish = client.publish;
			this.admin.clients[j].subscribe = client.subscribe;
			this.admin.clients[j].description = client.description;
			this.onUpdateClient( client );
		}
	}

	//if we did not find a matching client, then add this one
	if ( !existing_client ) {
		console.log("new client logged on " + client.name + " address " + client.remoteAddress);				

		this.admin.clients.push( client );
		this.onNewClient( client );
	}
}

Spacebrew.Admin._setLocalIPAddress = function ( client ) {
	var match_confirmed = true
		, cur_pub_sub = ["subscribe", "publish"]
		, client_config = []
		, local_config = []
		;

	// check if client already exists
	if (client.name === this._name && !this.admin.remoteAddress) {
		if ((client.publish.messages.length == this.client_config.publish.messages.length) &&
			(client.subscribe.messages.length == this.client_config.subscribe.messages.length)) {

			for (var j = 0; j < cur_pub_sub.length; j ++ ) {
				client_config = client[cur_pub_sub[j]].messages;
				local_config = this.client_config[cur_pub_sub[j]].messages;

				for (var i = 0; i < client_config.length; i ++ ) {
					if (!(client_config[i].name === local_config[i].name) ||
						!(client_config[i].type === local_config[i].type)) {
						match_confirmed = false;
						break;
					}	
				}									
			}	
			if (match_confirmed){
				this.admin.remoteAddress = client.remoteAddress;	
				console.log("[_setLocalIPAddress] local IP address set to ", this.admin.remoteAddress);				
			}
		}
	}
}

/**
 * Returns the client that matches the name and remoteAddress parameters queried
 * @param  {String} name           	Name of the client application
 * @param  {String} remoteAddress  	IP address of the client apps
 * @return {Object}                	Object featuring all client config information
 */
Spacebrew.Admin.getClient = function (name, remoteAddress){
	var client;

	for( var j = 0; j < this.admin.clients.length; j++ ){
		client = this.admin.clients[j];
		if ( client.name === name && client.remoteAddress === remoteAddress ) {
			return client;
		}
	}
}



Spacebrew.Admin.subscribeListByType = function (type){
	return this._pubSubByType("subscribe", type);
}

Spacebrew.Admin.publishListByType = function (type){
	return this._pubSubByType("publish", type);
}

Spacebrew.Admin._pubSubByType = function (pub_or_sub, type){
	var client = {}
		, filtered_clients = []
		, pub_sub_item = {}
		, new_item = {}
		;

	for( var j = 0; j < this.admin.clients.length; j++ ){
		client = this.admin.clients[j];
		for (var i = 0; i < client[pub_or_sub].messages.length; i++) {
			pub_sub_item = client[pub_or_sub].messages[i];
			if ( pub_sub_item.type === type ) {
				new_item = { clientName: client.name
							, remoteAddress: client.remoteAddress 
							, name: pub_sub_item.name
							, type: pub_sub_item.type
						};
				filtered_clients.push( new_item );
			}			
		}
	}
	return filtered_clients;
}

/**
 * Method that is used to add a route to the Spacebrew server
 * @param {String or Object} pub_client 	Publish client app name OR
 *                   						object with all publish information.
 * @param {String or Object} pub_address 	Publish app remote IP address OR
 *                   						object with all subscribe information.
 * @param {String} pub_name    				Publish name 
 * @param {String} sub_client  				Subscribe client app name
 * @param {String} sub_address 				Subscribe app remote IP address 
 * @param {String} sub_name    				Subscribe name
 */
Spacebrew.Admin.addRoute = function ( pub_client, pub_address, pub_name, sub_client, sub_address, sub_name ){
	this._updateRoute("add", pub_client, pub_address, pub_name, sub_client, sub_address, sub_name);
}

Spacebrew.Admin.addSubRoute = function ( pub_name, sub_client, sub_address, sub_name ){
	if (!this.admin.remoteAddress) return;
	this._updateRoute("add", this._name, this.admin.remoteAddress, pub_name, sub_client, sub_address, sub_name);
}

Spacebrew.Admin.addPubRoute = function ( sub_name, pub_client, pub_address, pub_name){
	if (!this.admin.remoteAddress) return;
	this._updateRoute("add", pub_client, pub_address, pub_name, this._name, this.admin.remoteAddress, sub_name);
}

/**
 * Method that is used to remove a route from the Spacebrew server
 * @param {String or Object} pub_client 	Publish client app name OR
 *                   						object with all publish information.
 * @param {String or Object} pub_address 	Publish app remote IP address OR
 *                   						object with all subscribe information.
 * @param {String} pub_name    				Publish name 
 * @param {String} sub_client  				Subscribe client app name
 * @param {String} sub_address 				Subscribe app remote IP address 
 * @param {String} sub_name    				Subscribe name
 */
Spacebrew.Admin.removeRoute = function ( pub_client, pub_address, pub_name, sub_client, sub_address, sub_name ){
	this._updateRoute("remove", pub_client, pub_address, pub_name, sub_client, sub_address, sub_name);
}

Spacebrew.Admin.removeSubRoute = function ( pub_name, sub_client, sub_address, sub_name ){
	if (!this.admin.remoteAddress) return;
	this._updateRoute("remove", this._name, this.admin.remoteAddress, pub_name, sub_client, sub_address, sub_name);
}

Spacebrew.Admin.removePubRoute = function ( sub_name, pub_client, pub_address, pub_name){
	if (!this.admin.remoteAddress) return;
	this._updateRoute("remove", pub_client, pub_address, pub_name, this._name, this.admin.remoteAddress, sub_name);
}

/**
 * Method that handles both add and remove route requests. Responsible for parsing requests
 * and communicating with Spacebrew server
 * @private
 * 
 * @param {String} type 					Type of route request, either "add" or "remove"
 * @param {String or Object} pub_client 	Publish client app name OR
 * @param {String or Object} pub_client 	Publish client app name OR
 *                   						object with all publish information.
 * @param {String or Object} pub_address 	Publish app remote IP address OR
 *                   						object with all subscribe information.
 * @param {String} pub_name    				Publish name 
 * @param {String} sub_client  				Subscribe client app name
 * @param {String} sub_address 				Subscribe app remote IP address 
 * @param {String} sub_name    				Subscribe name
 */
Spacebrew.Admin._updateRoute = function ( type, pub_client, pub_address, pub_name, sub_client, sub_address, sub_name ){
	var new_route
		, route_type
		, subscribe
		, publish
		;

	// if request type is not supported then abort
	if (type !== "add" && type !== "remove") return;

	// check if pub and sub information was in first two arguments. If so then 
	if ((pub_client.clientName && pub_client.remoteAddress && pub_client.name && pub_client.type != undefined) &&
		(pub_address.clientName && pub_address.remoteAddress && pub_address.name && pub_address.type != undefined)) {
		new_route = {
			route: {
				type: type,
				publisher: pub_client,
				subscriber: pub_address				
			}
		}

		if (type === "add") {
			for (var i = 0; i < this.admin.routes.length; i++) {
				// if route does not exists then create it, otherwise abort
				if (!this._compareRoutes(new_route, this.admin.routes[i])) this.admin.routes.push(new_route);
				else return;
			}
		}

		else if (type === "remove") {
			for (var i = this.admin.routes.length - 1; i >= 0; i--) {
				// if route exists then remove it, otherwise abort
				if (this._compareRoutes(new_route, this.admin.routes[i])) this.admin.routes.splice(i,i);
				else return;
			}
		}

		// send new route information to spacebrew server
		console.log("[_updateRoute] sending route to admin ", JSON.stringify(new_route));
		this.socket.send(JSON.stringify(new_route));
		return;
	}

	pub_type = this.getPublishType(pub_client, pub_address, pub_name);
	sub_type = this.getSubscribeType(sub_client, sub_address, sub_name);
	if (pub_type != sub_type || pub_type == false || pub_type == undefined) {
		console.log("[_updateRoute] not routed :: types don't match - pub:" + pub_type + " sub:  " + sub_type);
		return;
	}

	publish = {
		clientName: pub_client,
		remoteAddress: pub_address,
		name: pub_name,
		type: pub_type
	}
	console.log("[_updateRoute] created pub object ", publish);

	subscribe = {
		clientName: sub_client,
		remoteAddress: sub_address,
		name: sub_name,
		type: sub_type
	}
	console.log("[_updateRoute] created sub object ", subscribe);

	// call itself with publish and subscribe objects properly formatted
	this._updateRoute(type, publish, subscribe);
}

Spacebrew.Admin._compareRoutes = function (route_a, route_b){
	if ((route_a.clientName === route_b.clientName) &&
		(route_a.name === route_b.name) &&
		(route_a.type === route_b.type) &&
		(route_a.remoteAddress === route_b.remoteAddress)) {
		return true;
	}
	return false;
}

Spacebrew.Admin.getPublishType = function (client_name, remote_address, pub_name){
	return this._getPubSubType("publish", client_name, remote_address, pub_name);
}

Spacebrew.Admin.getSubscribeType = function (client_name, remote_address, sub_name){
	return this._getPubSubType("subscribe", client_name, remote_address, sub_name);
}

Spacebrew.Admin._getPubSubType = function (pub_or_sub, client_name, remote_address, pub_sub_name){
	var clients;

	for( var j = 0; j < this.admin.clients.length; j++ ){
		client = this.admin.clients[j];
		if ( client.name === client_name && client.remoteAddress === remote_address ) {
			for( var i = 0; i < client[pub_or_sub].messages.length; i++ ){
				console.log("Compare Types " + client[pub_or_sub].messages[i].name + " with " + pub_sub_name)
				if (client[pub_or_sub].messages[i].name === pub_sub_name) {
					return client[pub_or_sub].messages[i].type;
				}
			}
		}
	}
	return false;
}

Spacebrew.Admin.isThisApp = function (client_name, remote_address){
	if (this._name === client_name && this.admin.remoteAddress === remote_address) return true;
	else return false;
}