/*!
 *  Text Transform :: Models  *
 * 
 *  This file holds the Text Transform data model class. This class defines the data model for
 *  this app, and is updated by the controller object.
 *   
 *  <br />Copyright (C) 2012 LAB at Rockwell Group http://lab.rockwellgroup.com
 *
 * @filename    models.js
 * @author      Julio Terra from LAB at Rockwell Group
 * @modified    12/01/2012
 * @version     1.0.0
 * 
 */

/**
 * Model Namespace for the Model class
 * @type {Object}
 */
var Model = {};


/**
 * isJson Method that checks an object to determine if it is a json object
 * @param  {Object}  value Holds object that will be checked
 * @return {Boolean}       Returns true if object is a json object, false otherwise
 */
Model.isJson = function (value) {
    try {
        JSON.stringify(value);
        return true;
    } catch (ex) {
        return false;
    }
};

/**
 * Model.app Constructor method for the Model.app class. It holds the data model for the application, 
 * 		which is updated by the controller.. 
 * 		
 * @param  {Object} _config Object featuring the following attributes: (1) transforms; (2) incoming; 
 *                          (3) channels; (4) publish; (5) subscription
 *                          
 * @return {Model.app}		Returns an instance of the Model.app  class.         
 */
Model.app = function (_config) {
	if (_config) { 
		this.config(_config);
	}

	// check if local storage is available on current browser
	if (Modernizr.localstorage) {
		this.storageAvail = true;
		this.storageKey += this.name;
	} 

	if (this.debug) console.log("[Model.app] calling constructor ");
}

/**
 * Model.app.prototype Class definition where all attributes and methods of the Model.app class 
 *        are defined.
 *        
 * @type {Object}
 */
Model.app.prototype = {
	constructor: Model.app,		// holds link to constructor
	name: "",					// holds the name of the app used for spacebrew and local storage
	incoming: {},				// holds incomingMsglist object that stores incoming messages
	transforms: {},				// holds transformList object that stores transform maps
	channels: {},				// holds pubSubList object that stores a list of all publication and subscription channells
	storageKey: "sbTTApp_", 		// holds the base "key" used for local storage
	storageAvail: false, 		// flag that identifies if local storage is available
	debug: false,				// flag that identifies if debug messages should be output

	/**
	 * config Method that configures the model based on the argument that is provided. 
	 * 
	 * @param  {Object} _config Object featuring the following attributes: 
	 *                          (1) transforms: holds the transformList that contains all transform maps and the 
	 *                          	curId, used to create the id of new transform maps; 
	 *                          (2) incoming: holds the IncomingList that contains all incoming messages and the 
	 *                          	max length of the incoming.msgs array; 
	 *                          (3) channels: holds the pubSubList  that holds arrays with the names of the publication 
	 *                          	and subscription channels.
	 *                          (4) publish: holds an array with publish channels that can be used to create the 
	 *                          	channels object.
	 *                          (5) subscription: holds an array with subscribe channels that can be used to create  
	 *                          	the channels object.
	 *                          (6) debug: holds a boolean value that sets debug logging on and off.
	 */
	config: function (_config) {
		// if argument was provided then use it to configure the model
		if (_config) {
			this.transforms = _config["transforms"] || new Model.transformList();
			this.incoming = _config["incoming"] || new Model.incomingList();

			// set the channels attribute using the channels or publish and subscribe attributes
			if (_config["channels"]) this.channels = _config["channels"];
			else {
				var channelConfig = {};
				if (_config["publish"] && _config["subscribe"]) channelConfig = {"publish":_config["publish"], "subscribe":_config["subscribe"]};
				this.channels = new Model.pubSubList(channelConfig);									
			}
			this.name = _config["name"] || "sbTextTransform";
			this.debug = (_config["debug"] == true) ? true : false;		
		}

		// check if local storage is available on current browser
		if (Modernizr.localstorage) {
			this.storageAvail = true;
			this.storageKey += this.name;
		} 

		console.log("[Model.app:config] calling constructor " + this.name  + " key " + this.storageKey);
	},

	/**
	 * load Method that loads a model from a json object. The json object needs to be structured properly
	 * 		for the data to load. The structure of the json object is described in the readme file. 
	 * 		
	 * @param  {Object} _json 
	 */
	load: function(_json) {

		var valid_data = false;

		// if _json object is null then try to load data from local storage
		if (!_json) {
			// check if storage is available
			if (this.storageAvail) {
				var modelStr = localStorage.getItem(this.storageKey);
				try {
					_json = $.parseJSON(modelStr);
					console.log("[Model:load] loading model from local storage: ", this.stringify());
				} catch (e) {
					_json = "";
				}
			}
		}

		// if _json object is still null then we have no data to load
		if (!_json) return false;

		// handle string arguments
		else if (typeof _json == 'string') {
			try {
				_json = $.parseJSON(_json);
			} catch (ex) {
		        return false;
		    }
		}
		console.log("[Model.app:load] loading json object into model ", _json);

		// handle json objects
		if (Model.isJson(_json)) {
			if (_json["incoming"]) this.incoming.load(_json.incoming);
			if (_json["transforms"]) this.transforms.load(_json.transforms);
			if (_json["channels"]) this.channels.load(_json.channels);
			return true;
		} else {
			return false;
		}

	},

	/**
	 * save Method that saves the data model to the local storage. It first checks to confirm that
	 * 		the browser supports this functionality.
	 */
	save: function() {
		if (this.storageAvail) {
			localStorage.setItem(this.storageKey, this.stringify());
			console.log("[Model:save] storage key ", this.storageKey);
			console.log("[Model:save] updated model saved ", localStorage.getItem(this.storageKey));
		}
	},

	/**
	 * stringify Method that returns a string version of the current state of the data model
	 * 
	 * @return {string} String that reflects the current state of the data model
	 */
	stringify: function() {
		return '{"incoming":' + this.incoming.stringify() + 
				',"transforms":' + this.transforms.stringify() +
				',"channels":' + this.channels.stringify() +
				'}' ;
	},
}

/**
 * Model.pubSubItem Constructor method for the Model.pubSubItem class. It holds the data model designed 
 * 		to store the individual publication and subscription channel settings (inlets and outlets). 
 * 		
 * @param  {Object} _config Object featuring the following attributes: 
 *                          (1) name: name of the inlet or outlet; 
 *                          (2) type: the data type of the data sent via this inlet or outlet; (3) debug: flag
 *                          	that turns and and off debug logging.
 *                          (3) debug: holds a boolean value that sets debug logging on and off.
 *                          
 * @return {Model.pubSubItem} Returns an instance of the Model.pubSubItem class.         
 */
Model.pubSubItem = function (_config) {
	if (_config) {
		this.name = _config["name"] || "";
		this.type = _config["type"] || "";
		this.debug = (_config["debug"] == true) ? true : false;		
	}
	if (this.debug) console.log("[Model.pubSubItem] calling constructor ", _config);
},				

/**
 * Model.pubSubItem.prototype Class definition where all attributes and methods of the 
 * 		Model.pubSubItem.prototype class are defined.
 *        
 * @type {Object}
 */
Model.pubSubItem.prototype = {
	constructor: Model.pubSubItem,	// link to constructor
	name: "",						// name of the subscription or publication channel
	type: "",						// type of channel
	debug: false,					// flag that identifies if debug messages should be output

	/**
	 * stringify Method that returns a string version of the current state of this data item
	 * 
	 * @return {string} String that reflects the current state of this data item
	 */
	stringify: function() {
		return '{"name":"' + this.name + '","type":"' + this.type + '"}' ;
	}
}

/**
 * Model.pubSubList Constructor method for the Model.pubSubList class. It holds the data model designed 
 * 		to store arrays that contain lists of publication and subscription channels (inlets and outlets). 
 * 		
 * @param  {Object} _config Object featuring the following attributes: 
 *                          (1) publish: array that holds all of the publish channel names and types; 
 *                          (2) subscribe: array that holds all of the subscribe channel names and types; 
 *                          (3) debug: flag that turns and and off debug logging. 
 *                          (4) debug: holds a boolean value that sets debug logging on and off.
 *                          
 * @return {Model.pubSubList} Returns an instance of the Model.pubSubList class.         
 */
Model.pubSubList = function (_config) {
	if (_config) {
		this.load(_config);
	}
	if (this.debug) console.log("[Model.pubSubList] calling constructor ", _config);
}

/**
 * Model.pubSubList.prototype Class definition where all attributes and methods of the 
 * 		Model.pubSubList.prototype class are defined.
 *        
 * @type {Object}
 */
Model.pubSubList.prototype = {
	constructor: Model.pubSubList,	// link to constructor
	publish: [],					// holds pubSubItems for the publication channels
	subscribe: [],					// holds pubSubItems for the subscription channels
	debug: false,					// flag that identifies if debug messages should be output

	/**
	 * load Method that loads a pubSubList from a properly formatted json object. 
	 * 
	 * @param  {Json} _json Holds arrays with names and types of publication or subscription channels
	 *                      used to load data into a pubSub list object.
	 */
	load: function(_json) {
		if (this.debug) console.log("[Model.pubSubList:load] loading new data ", _json);
		this.publish = []; this.subscribe = [];

		// check if argument is a json object
		if (Model.isJson(_json)) {
			// loop through top-level attributes of the json object 
			for (var j in _json) {
				if (this.debug) console.log("[Model.pubSubList:load] loading item '" + j + "'");

				// if this data model has an attribute of the same name, then update it
				if ((this[j] != null) && ((j == "publish") || (j == "subscribe"))) {
					for (var i in _json[j]) {
						var newItem = new Model.pubSubItem(_json[j][i]);
						this[j].push(newItem);
						if (this.debug) console.log("\t", newItem);
					}
				}

				else if ((this[j] != null) && (j == "debug")) {
					if (this.debug) console.log("[Model.pubSubList:load] loading item '" + j + "' " + _json[j]);
					this[j] = _json[j];
				}

			}
		}
	},

	/**
	 * stringify Method that returns a string version of the current state of this data model
	 * 
	 * @return {string} String that reflects the current state of this data model
	 */
	stringify: function() {
		// create
		var newString = '{"publish":[';
		for (var p in this.publish) {
			if (p != 0) newString += ',';
			newString += this.publish[p].stringify();
		}
		newString += '], "subscribe":[';
		for (var s in this.subscribe) {
			if (s != 0) newString += ',';
			newString += this.subscribe[s].stringify();
		}
		newString += ']}'

		return newString;
	}
}

/**
 * Model.transform Constructor method for the Model.transform class. It holds the data model designed 
 * 		to store individual transform maps. 
 * 		
 * @param  {Object} _config Object featuring the following attributes: 
 *                          (1) incoming: the key message that, when received, triggers the app to 
 *                          	send the mapped message;
 *                          (2) outgoing: the mapped message that is sent out when the key message is
 *                          	received; 
 *                          (3) inlet: the inlet(s) that this map will listen to for a key message;
 *                          (4) outlet: the outlet(s) that this map will publish mapped messages to
 *                          (5) debug: holds a boolean value that sets debug logging on and off.
 *                          
 * @return {Model.transform} Returns an instance of the Model.transform class.         
 */
Model.transform = function (_config) {
	if (_config) {
		this.incoming = _config["incoming"] || "";
		this.inlet = _config["inlet"] || "all_inlets";
		this.outgoing = _config["outgoing"] || "";
		this.outlet = _config["outlet"] || "all_outlets";			
		this.debug = (_config["debug"] == true) ? true : false;		
	}
	if (this.debug) console.log("[Model.transform] calling constructor ", _config);
},				

/**
 * Model.transform.prototype Class definition where all attributes and methods of the 
 * 		Model.transform.prototype class are defined.
 *        
 * @type {Object}
 */
Model.transform.prototype = {
	constructor: Model.transform,	// link to the constructor
	incoming: "",					// holds incoming/key message for this map
	inlet: "all_inlets",			// holds name of inlet that this map listens to
	outgoing: "",					// holds outgoing/mapped message for this map
	outlet: "all_outlets",			// holds name of outlet that this map publishes to 
	debug: false,					// flag that identifies if debug messages should be output

	/**
	 * stringify Method that returns a string version of the current state of this data item
	 * 
	 * @return {string} String that reflects the current state of this data item
	 */
	stringify: function() {
		return '{"incoming":"' + this.incoming + '","inlet":"' + this.inlet + 
				'","outgoing":"' + this.outgoing + '","outlet":"' + this.outlet + '"}';
	}
}

/**
 * Model.transformList Constructor method for the Model.transformList class. It holds the data model 
 * 		designed to store transform map lists. 
 * 		
 * @param  {Object} _config Object featuring the following attributes: 
 *                          (1) maps: a json object that contains key value pairs that feature the map
 *                          	id coupled with a json object formatted like a transform map;
 *                          (2) curId: the current id that is used to create the id name for any
 *                          	new transform maps. These ids are used as keys in the maps hash list; 
 *                          (3) debug: holds a boolean value that sets debug logging on and off.
 *                          
 * @return {Model.transform} Returns an instance of the Model.transform class.         
 */
Model.transformList = function (_config) {
	if (_config) {
		this.load(_config);
	}
	if (this.debug) console.log("[Model.transformList] calling constructor ", _config);
}

/**
 * Model.transformList.prototype Class definition where all attributes and methods of the 
 * 		Model.transformList.prototype class are defined.
 *        
 * @type {Object}
 */
Model.transformList.prototype = {
	constructor: Model.transformList,	// link to constructor
	maps: {},							// holds hashlist with keys (ids) and values (transform maps)
	curId: 0,							// holds the curId, which is used to create the ids for new transforms
	debug: false,						// flag that identifies if debug messages should be output

	/**
	 * load Method that loads data into the data model from a json object.
	 * 
	 * @param  {Json} _json Holds a json object with the following attributes: maps, curId, and debug,
	 *                      as defined constructor documentation.
	 */
	load: function(_json) {
		if (this.debug) console.log("[Model.transformList:load] loading new data ", _json);

		this.maps = {};
		this.curId = 0;

		// make sure argument is a json object
		if (Model.isJson(_json)) {

			// loop through all elements in the json object to load attributes into model
			for (var j in _json) {
				// handle maps attribute by loading each element of the hash list
				if (this[j] && j == "maps") {
					for (var i in _json[j]) {
						if (this.debug) console.log("[Model.transformList:load] loading item '" + j + "'");
						this[j][i] = new Model.transform(_json[j][i]);
						if (this.debug) console.log("\t", this[j][i]);
					}
				}
				// handle curId and debug attributes 
				if ((this[j] != null) && ((j == "curId") || (j == "debug"))) {
					if (this.debug) console.log("[Model.transformList:load] loading item '" + j + "' " + _json[j]);
					this[j] = _json[j];
				}
			}
		}
	},

	/**
	 * stringify Method that returns a string version of the current state of this data model
	 * 
	 * @return {string} String that reflects the current state of this data model
	 */
	stringify: function() {
		var newString = '{"maps":{';
		var loop = 0;
		for (var p in this.maps) {
			if (loop != 0) newString += ',';
			newString += '"' + p + '":' + this.maps[p].stringify();
			loop += 1;
		}
		newString += '}, "curId":' +  this.curId + '}';

		if (this.debug) console.log("[Model.transformList:stringify] ", newString);
		return newString;
	}
}

/**
 * Model.incomingMsg Constructor method for the Model.incomingMsg class. It holds the data model 
 * 		designed to store individual incoming messages. 
 * 		
 * @param  {Object} _config Object featuring the following attributes: 
 *                          (1) message: the text of the incoming message;
 *                          (2) source: the name of subscription channel where the message was received; 
 *                          (3) debug: holds a boolean value that sets debug logging on and off.
 *                          
 * @return {Model.transform} Returns an instance of the Model.transform class.         
 */
Model.incomingMsg = function (_msg) {
	if (_msg) {
		this.message = _msg["message"] || "";
		this.source = _msg["source"] || "all_inlets";		
		this.debug = (_msg["debug"] == true) ? true : false;		
	}
	if (this.debug) console.log("[Model.incomingMsg] calling constructor ", _msg);
}

/**
 * Model.incomingMsg.prototype Class definition where all attributes and methods of the 
 * 		Model.incomingMsg.prototype class are defined.
 *        
 * @type {Object}
 */
Model.incomingMsg.prototype = {
	constructor: Model.incomingMsg,	// link to constructor
	message: "",					// holds the message of this data item
	source: "all_inlets",			// holds the inlet where data item was received
	debug: false,					// flag that identifies if debug messages should be output

	/**
	 * stringify Method that returns a string version of the current state of this data item
	 * 
	 * @return {string} String that reflects the current state of this data item
	 */
	stringify: function() {
		return '{"message":"' + this.message + '","source":"' + this.source + '"}';
	}
}

/**
 * Model.incomingList Constructor method for the Model.incomingList class. It holds the data model 
 * 		designed to store the incoming message list. 
 * 		
 * @param  {Object} _config Object featuring the following attributes: 
 *                          (1) msgs: an array that contains json objects formatted like an incomingMsg
 *                          	object, containing a message and source attribute;
 *                          (2) maxLengh: an integer that sets the number of incoming messages that
 *                          	are displayed; 
 *                          (3) debug: holds a boolean value that sets debug logging on and off.
 *                          
 * @return {Model.transform} Returns an instance of the Model.transform class.         
 */
Model.incomingList = function (_config) {
	if (_config) {
		this.load(_config);
	}
	if (this.debug) console.log("[Model.incomingList] calling constructor ", _config);
}

/**
 * Model.incomingList.prototype Class definition where all attributes and methods of the 
 * 		Model.incomingList.prototype class are defined.
 *        
 * @type {Object}
 */
Model.incomingList.prototype = {
	constructor: Model.incomingList,	// link to constructor
	msgs: [],							// array that holds the incomingMsg objects
	maxLength: 5,						// holds the maximum lenght of the msgs array
	debug: false,						// flag that identifies if debug messages should be output


	/**
	 * load Method that loads data into the data model from a json object.
	 * 
	 * @param  {Json} _json Holds a json object with the following attributes: msgs, maxLength, and 
	 *                      debug as defined constructor documentation.
	 */
	load: function(_json) {
		console.log("[Model.incomingList:load] loading new data ", _json);
		this.msgs = [];
		this.maxLength = 5;

		// check if argument is a json object
		if (Model.isJson(_json)) {
			// loop through all attributes of the json object 
			for (var j in _json) {
				console.log("[Model.incomingList:load] loading items '" + j + "'");
				// if msgs attribute exists then update the msgs array
				if (this[j] && j == "msgs") {
					for (var i in _json[j]) {
						var newItem = new Model.incomingMsg(_json[j][i]);
						this[j].push(newItem);
						console.log("\t", newItem);
					}
				}
				// if maxLength or debug attributes exist then update the appropriate variables
				else if (this[j] && ((j == "maxLength") || (j == "debug"))) {
					this.maxLength = this[j];
				}
			}
		}
	},

	/**
	 * stringify Method that returns a string version of the current state of this data model
	 * 
	 * @return {string} String that reflects the current state of this data model
	 */
	stringify: function() {
		var newString = '{"msgs":[';
		for (var p in this.msgs) {
			if (p != 0) newString += ',';
			newString += this.msgs[p].stringify();
		}
		newString += '], "maxLength":' +  this.maxLength + '}';

		return newString;
	}
}
