/*!
 *  Text Transform :: View  *
 * 
 *  The view class handles the user interface, including updating the display and  
 *  managing all interface listeners (click, blur, etc). 
 *  
 *  <br />Copyright (C) 2012 LAB at Rockwell Group http://lab.rockwellgroup.com
 *
 * @filename    view.js
 * @author      Julio Terra from LAB at Rockwell Group
 * @modified    12/01/2012
 * @version     1.0.0
 * 
 */

/**
 * View Namespace for View class
 * @type {Object}
 */
View = {};

/**
 * View.app Constructor method for the View.app class. It holds controls all user interface elements, 
 * 		including display and the event listeners.
 * 		
 * @param  {Object} _config Object featuring the following attributes: (1) controller: a link to the
 *                          controller that is running the app; (2) debug: flag that determine whether
 *                          debug logging should be turned on.
 * @return {View.app}		Returns an instance of the view.app class.         
 */
View.app = function (_config) {
	if (this.debug) console.log("[View] calling constructor ");
	if (_config) this.config(_config);
}

/**
 * View.app.prototype Class definition where all attributes and methods of the View.app class are
 *        defined.
 * @type {Object}
 */
View.app.prototype = {
	constructor: View.app,	// link to constructor
	initialized: false,		// flag that identifies if view has been initialized
	controller: {},			// link to the app controller
	debug: true,			// flag to identify if debug messages should be output

	/**
	 * config Method that configures the view by linking it the controller, and setting debugging
	 *        on and off.		
	 * @param  {object} _config Object featuring the following attributes: (1) controller: a link to the
 	 *                          controller that is running the app; (2) debug: flag that determine whether
	 *                          debug logging should be turned on.
	 * @return {none}         
	 */
	config: function(_config) {
		if (_config) {
			this.controller = _config["controller"] || this.controller || {};
			this.debug = (_config["debug"] == true) ? true : false;		
		}
		if (this.debug) console.log("[View:config] ", _config);
	},

	/**
	 * begin Method that customizes the template transform map form based on the configuration for the number of
	 * 		outlets and inlets, and then sets the listener for the "add one more" button.	
	 * @return {none} 
	 */
	begin: function() {
		// configure device for iPhone, if appropriate 
		this.deviceCheck();

		// remove all existing content items from the form
		$('#contentList .contentItem').remove();

		// create the inlet and outlet dropdown list based on the number of SpaceBrew "subscribes" and "publishes"
		if (this.debug) console.log("[View:begin] setting up inlets ", JSON.stringify(this.controller.model.channels.subscribe));
		for (i = 0; i < this.controller.model.channels.subscribe.length; i++) {
			var $inletItem = $("#ddlList .inletItem").clone();
			$inletItem.attr("value", this.controller.model.channels.subscribe[i].name);
			$inletItem.text(this.controller.model.channels.subscribe[i].name);
			$inletItem.appendTo("#lib .inletList");
			if (this.debug) console.log("\tappending inlet ", $inletItem.parent().parent().parent().parent().parent());
	    }

		if (this.debug) console.log("[View:begin] setting up outlets ", this.controller.model.channels.publish);
		for (i = 0; i < this.controller.model.channels.publish.length; i++) {
			var $outletItem = $("#ddlList .outletItem").clone();
			$outletItem.attr("value", this.controller.model.channels.publish[i].name);
			$outletItem.text(this.controller.model.channels.publish[i].name);
			$outletItem.appendTo("#lib .outletList");
			if (this.debug) console.log("\tappending outlet ", $outletItem.parent().parent().parent().parent().parent());
	    }

		this.addItemListener();		// set-up the click listener for the "one more please" button
	},

	/**
	 * deviceCheck Method that customizes the css for iPhones, when appropriate.
	 * @return {none} 
	 */
	deviceCheck: function () {
		// check if device is an iphone
		if( navigator.userAgent.match(/iPhone/i) ) {
			console.log("[View:deviceCheck] updating css for iPhone ");

			// update the width of all appropriate css attributes
			$("#contentListDiv").css("width", "280px");
			$("#incomingMsgDiv").css("width", "280px");
			$("#statusMsgDiv").css("width", "280px");
			$("#statusMsgDiv h1").css("width", "280px");
			$("#statusMsgDiv p").css("width", "280px");
			$("header").css("width", "280px");
			$("header h1").css("width", "280px");
			$("header p").css("width", "280px");

			// update the patting of all appropriate css attributes
			$("#contentListDiv").css("padding", "0px 0px");
			$("#incomingMsgDiv").css("padding", "0px 0px");
			$("#statusMsgDiv").css("padding", "20px 20px");
			$("header").css("padding", "20px 20px");
		} 

		else {
			console.log("[View:deviceCheck] not updating css, user agent: ", navigator.userAgent);
		}  
	},

	/**
	 * showApp Method that shows the transform maps and incoming messages and hides the 
	 * 		status message div.
	 * 		
	 */
	showApp: function() {
		if (this.debug) console.log("[View:showApp]");
		$("#statusMsgDiv").css('visibility', 'hidden');
		$("#statusMsgDiv").css('display', 'none');
		$("#contentListDiv").css('display', 'inline-block');
		$("#incomingMsgDiv").css('display', 'inline-block');
		$("#contentListDiv").css('visibility', 'visible');
		$("#incomingMsgDiv").css('visibility', 'visible');
	},

	/**
	 * showStatus Method that shows the status message div, and hides the transform maps and
	 * 		incoming messages divs.
	 * @return {none} 
	 */
	showStatus: function() {
		if (this.debug) console.log("[View:showStatus]");
		$("#statusMsgDiv").css('display', 'block');
		$("#statusMsgDiv").css('visibility', 'visible');
		$("#contentListDiv").css('visibility', 'hidden');
		$("#incomingMsgDiv").css('visibility', 'hidden');
		$("#contentListDiv").css('display', 'none');
		$("#incomingMsgDiv").css('display', 'none');
	},

	/**
	 * updateStatus Method that updates the status message that is featured in the statusMsg
	 * 		div. Note that this div is not visible when the app is active.
	 * @param  {String} _new_status Message that is displayed in the statusMsg div
	 */
	updateStatus: function(_new_status) {
		$("#statusMsg").html(this.textToHtml(_new_status));		
	},

	/**
	 * update Method that updates the transform and incoming message lists.
	 */
	update: function() {
		this.updateTransformList();
		this.updateIncomingList();
	},

	/**
	 * updateTransformList function that updates the list of transform maps that are displayed. 
	 * 		It also registers event listeners associated to the transform map list.
	 * @param  {object} newEleId The id of the new element in the transforms.map hash list
	 */
	updateTransformList: function() {

		// remove all received messages from the page
		$("#contentList .contentItem").remove();        

		if (this.debug) console.log("[updateTransformList] this.controller.model.transforms.maps: ", JSON.stringify(this.controller.model.transforms.maps));                         

		// look through the array of incoming messages and update the list accordingly
		for (var i in this.controller.model.transforms.maps) {
			// set the value for each field
			var $newEle = $("#lib .contentItem").clone();
			$newEle.attr( {id: i} );
			$newEle.find(".contentItemName").text(i);
			$newEle.find(".incomingMsg").val(this.controller.model.transforms.maps[i].incoming);
			$newEle.find(".inletList").val(this.controller.model.transforms.maps[i].inlet);
			$newEle.find(".outgoingMsg").val(this.controller.model.transforms.maps[i].outgoing);
			$newEle.find(".outletList").val(this.controller.model.transforms.maps[i].outlet);
			$newEle.appendTo('#contentList');
			if (this.debug) console.log("[updateTransformList] created a new list item", $newEle);
		}

		// update the event listeners for all form elements
		this.manageItemListeners();
	},

	/**
	 * updateIncomingList function that updates the list of incoming messages. It also registers 
	 * 		click event listener for the button that enables users to create a transform from any 
	 * 		incoming message.
	 */
	updateIncomingList: function() {
		// remove all received messages from the page
		$("#incomingMsgList .incomingMsgItem").remove();        

		var self = this;
		// look through the array of incoming messages and update the list accordingly
		for (var i = this.controller.model.incoming.msgs.length - 1; i >= 0; i--) {
			// set the value for each field
			$newEle = $("#lib .incomingMsgItem").clone();
			$newEle.attr("id", "incomingMsgItem" + i);
			$newEle.find(".msgInlet").text(this.controller.model.incoming.msgs[i]["source"]);
			$newEle.find(".msgTxt").text(this.controller.model.incoming.msgs[i]["message"]);
			$newEle.appendTo('#incomingMsgList');
			var curMsg = this.controller.model.incoming.msgs[i];

			if (this.debug) console.log("[updateIncomingList] curMsg ", curMsg);

			// register a click listener for the transform button for each message
			$newEle.click(curMsg, function(e) {
				if (this.debug) console.log("[updateIncomingList] click curMsg ", e.data);
				self.controller.addTransform(e.data);
			});
			// if (this.debug) console.log("[updateIncomingList] added new message ", $newEle);
		}

	},

	/**
	 * addItemListener function that adds a click event listener to the Add New Item button. It uses a 
	 *  flag that ensures this listener is only registered once.
	 */
	addItemListener: function(){
		if (this.debug) console.log("[addItemListener] updated clickable elements");
		var self = this;
		// addTransform listener for addContentItem button only once
		if (!this.initialized) {
			this.initialized = true;
			$("#addContentItem").click(function() {
				if (this.debug) console.log("[manageItemListeners] addTransform new item button clicked");
				self.controller.addTransform();
				self.manageItemListeners();
			});		
		}
	},

	/**
	 * manageItemListeners function that updates all of the button and text box change event listeners in the UI. 
	 *  Every time it is called it clears out all of the listeners first, and then adds the appropriate ones back.]
	 */
	manageItemListeners: function(){
		if (this.debug) console.log("[manageItemListeners] updated clickable elements");

		// save link to current scope in the self variable
		var self = this;

		// Clear old event listeners
		$(".contentItem .minusOne").unbind("click");
		$(".contentItem .fire").unbind("click");
		$(".contentItem .incomingMsg").unbind("change");
		$(".contentItem .outgoingMsg").unbind("change");

		// add event listener to clicks of the content-item-remove button for each element
		// unless there is only one left 
		if ($(".contentItem .minusOne").length > 1) { 
			$(".contentItem .minusOne").click(function() {
				if (this.debug) console.log("[manageItemListeners] removing: ", $(this).parent().parent());
				var delEleId = $(this).parent().parent().attr("id");
				if (self.controller) {
					self.controller.deleteTransform(delEleId);
					self.controller.saveModel();
				}
				$(this).parent().parent().remove();
				self.manageItemListeners();
			});
		}

		// add click listener to the "send me" button
		$(".contentItem .fire").on("click", function() {
			var $curEle = $(this).parent().parent();
			var id = $curEle.attr("id"); 
			if (self.controller) self.controller.sendMsg(id);
			if (this.debug) console.log("[manageItemListeners] sending message: " + self.controller.model.transforms.maps[id]["outlet"] + " - " + self.controller.model.transforms.maps[id]["outgoing"]);
		});

		// add change listener to the incoming text box of each content-item
		$(".contentItem .incomingMsg").on("change", function() {
			var $curEle = $(this).parent().parent();
			var id = $curEle.attr("id"); 
			if (self.controller) {
				self.controller.model.transforms.maps[id]["incoming"] = $(this).val();
				self.controller.saveModel();
			}
			if (this.debug) console.log("[manageItemListeners] new incoming content: ", self.controller.model.transforms.maps);
		});

		// add change listener to the incoming text box of each content-item
		$(".contentItem .outgoingMsg").on("change", function() {
			var $curEle = $(this).parent().parent();
			var id = $curEle.attr("id"); 
			if (self.controller) {
				self.controller.model.transforms.maps[id]["outgoing"] = $(this).val();
				self.controller.saveModel();
			}
			if (this.debug) console.log("[manageItemListeners] new outgoing content: ", self.controller.model.transforms.maps);
		});

		// add change listener to the inlet dropdown list
		$(".contentItem .inletList").on("change", function() {
			var $curEle = $(this).parent().parent();
			var id = $curEle.attr("id");
			if (this.debug) console.log("[manageItemListeners] id: ", id);
			if (this.debug) console.log("[manageItemListeners] inletList selected value: ", $(this).val());
			if (self.controller) {
				self.controller.model.transforms.maps[id]["inlet"] = $(this).val();
				self.controller.saveModel();
			}
			if (this.debug) console.log("[manageItemListeners] new inlet: ", self.controller.model.transforms.maps);
		});

		// add change listener to the outlet dropdown list
		$(".contentItem .outletList").on("change", function() {
			var $curEle = $(this).parent().parent();
			var id = $curEle.attr("id");
			if (this.debug) console.log("[manageItemListeners] id: ", id);
			if (this.debug) console.log("[manageItemListeners] outletList selected value: ", $(this).val());
			if (self.controller) {
				self.controller.model.transforms.maps[id]["outlet"] = $(this).val();
				self.controller.saveModel();
			}
			if (this.debug) console.log("[manageItemListeners] new outlet: ", self.controller.model.transforms.maps);
		});
	},

	/**
	 * textToHtml Method the converts strings with line breaks ('\n') to html with line breaks ('<br>'). When
	 * 		using this method make sure to set the content using the .html() rather than .text() method.	
	 * @param  {String} text Holds the string message with '\n' line breaks
	 * @return {String}      Return the string message with '<br>' line breaks
	 */
	textToHtml: function (text) {
	    var newHtml = [];
	    var lines = text.split(/\n/);
	    // loop through lines and create a div element with each one
	    for (var i = 0 ; i < lines.length ; i++) {
	        newHtml.push(
	            $(document.createElement('div')).text(lines[i]).html()
	        );
	    }
	    // join the div elements together inserting a '<br>' between each one
	    return newHtml.join("<br>");
	}

}