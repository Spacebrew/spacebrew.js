/*!
 *  URL Launcher :: URL Launcher & TAB Managers Class *
 * 
 * 	brief An javascript class for chrome extension that does two things: 
 * 	(a) manages tabs to ensure that the appropriate tab is always the active tab, 
 * 		and that it remains in fullscreen.
 * 	(b) has the ability to set the active tab to a specific URL.
 * 	
 *  <br />Copyright (C) 2012 LAB at Rockwell Group http://lab.rockwellgroup.com
 *
 * @namespace 	LABcx
 * @filename    tab_manager.js
 * @author      The Lab (Julio Terra)
 * @modified    10/27/2012
 * @version     1.0.5
 * 
 */

var LABcx = {};

/**
 * UrlLauncherAndTabHandler Constructor that initializes key attributes of a new instance of the
 * 		UrlLauncherAndTabHandler class.  
 * @return {object} Newly created instance of UrlLauncherAndTabHandler
 */
LABcx.UrlLauncherAndTabHandler = function () {
	if (debug) console.log("[LABcx.UrlLauncherAndTabHandler] calling constructor ");
	this.tab_id = -1;
	this.window_id = -1;
	this.url = undefined;
	this.listener_focus = false;
	this.listener_close = false;
	this.listener_update = false;
}

LABcx.UrlLauncherAndTabHandler.prototype = {

	constructor: LABcx.UrlLauncherAndTabHandler,

	/***************************
	 ** INTERFACE METHODS
	 ***************************/

	/**
	 * updateOptions is called to load all of the listeners that are responsible for ensuring
	 * 		that the appropriate Chrome window and/or tab remains in focus. It is important to note that
	 *   	these listeners only start to function once the document that is loading the controller  
	 *    	has fully loaded.
	 * @param  {object} params New options that will determine which tab and window listeners are  
	 *                         added and/or removed from Chrome
	 * @return {none}        
	 */
	updateOptions: function (params) {
		if (debug) console.log("[LABcx.updateOptions] updated options: ");
	 	if (debug) console.log(params);

		this.go_fullscreen = (params.go_fullscreen == undefined) ? true : params.go_fullscreen;
		this.keep_tabs = (params.keep_tabs == undefined) ? false : params.keep_tabs;
		// this.loose_focus = (params.loose_focus == undefined) ? false : params.loose_focus;
		this.manageListeners();
		this.setActiveTab(params.tab);

		if (debug) console.log("[LABcx.updateOptions] fullscreen: ");
	 	if (debug) console.log(this.go_fullscreen);
	},

	/***************************
	 ** LISTENER SET-UP AND TAKE-DOWN METHODS
	 ***************************/

	/**
	 * manageListeners method used to add and remove tab and window listeners based on a set
	 * 		of options set via the update options method. It controls whether the app goes 
	 * 		fullscreen on startup, whether it allows non-active tabs to stay open, and 
	 * 		also if the tab running the chrome extension can loose focus
	 * @return {none}
	 */
	manageListeners: function() {

		if (!this.listener_update && this.go_fullscreen) {
			if (debug) console.log("[LABcx.manageListeners] setting up update listeners ");
			chrome.tabs.onUpdated.addListener(this.onTabUpdate.bind(this));
			this.listener_update = true;
		}

		if (!this.listener_close && !this.keep_tabs) {
			if (debug) console.log("[LABcx.manageListeners] setting up tab close listeners ");
			chrome.tabs.onRemoved.addListener(this.onTabClose.bind(this));
			chrome.windows.onRemoved.addListener(this.onWindowClose.bind(this));
			chrome.windows.onFocusChanged.addListener(this.onWindowFocusLost.bind(this));
			chrome.tabs.onActivated.addListener(this.onTabActiveChange.bind(this));	
			this.listener_close = true;
		} 

		if (this.listener_update && !this.go_fullscreen) {
			if (debug) console.log("[LABcx.manageListeners] removing update listeners ");
			chrome.tabs.onUpdated.removeListener(this.onTabUpdate.bind(this));
			this.listener_focus = false;
		}

		if (this.listener_close && this.keep_tabs) {
			if (debug) console.log("[LABcx.manageListeners] removing tab close listeners ");
			this.removeOnRemoveListeners();
			this.removeOnFocusListeners();
			this.listener_close = false;
		} 
	},

	/**
	 * removeOnFocusListeners method that removes the "focus" and "activation" related listeners   
	 * 		for window and tabs.
	 * @return {none} 
	 */
	removeOnFocusListeners: function () {
		chrome.windows.onFocusChanged.removeListener(this.onWindowFocusLost.bind(this));
		chrome.tabs.onActivated.removeListener(this.onTabActiveChange.bind(this));	
	},

	/**
	 * removeOnFocusListeners method that removes the "onRemove" listeners for tabs and windows. 
	 * @return {none}
	 */
	removeOnRemoveListeners: function () {
		chrome.tabs.onRemoved.removeListener(this.onTabClose.bind(this));
		chrome.windows.onRemoved.removeListener(this.onWindowClose.bind(this));
	},


	/***************************
	 ** CALLBACK METHODS
	 ***************************/

	/**
	 * onTabUpdate callback method that handles updates tabs and makes sure that they stay in full
	 * 		screen as appropriate
	 * @param  {int} tabId      	Id of the current tab
	 * @param  {object} changeInfo 	Overview of the changes to the tab's status that triggered callback
	 * @param  {object} tab        	Details about the tab that was just updated
	 * @return {none}            
	 */
	onTabUpdate: function(tabId, changeInfo, tab) {
		if (debug) console.log("[LABcx.onTabUpdate] update updated, tab info: ");
	 	if (debug) console.log(tab);
		if (this.go_fullscreen) chrome.windows.get(this.window_id, this.ensureFullscreen.bind(this));
	},

	/**
	 * onWindowClose callback method that handles window is close events. It checks the id of  
	 * 		the closed window to determine whether it needs to reopen a new window to get the 
	 *   	user back to the appropriate page.
	 * @param  {Object} windowId	objects that contains information the window that was closed 
	 * @return {none}       
	 */
	onWindowClose: function (windowId) {
	 	if (debug) console.log("[LABcx.onWindowClose] tab closed at: " + windowId);
	 	if (debug) console.log("[LABcx.onWindowClose] active tab is at: " + this.window_id);
	 	var self = this;
	 	var activeUrl = this.url;
	 	if (debug) console.log("[LABcx.onWindowClose] current url: " + self.url);
		if (windowId == this.window_id) {
			chrome.windows.create({focused:true, url:activeUrl}, this.setActiveTab.bind(this));
		}
	},

	/**
	 * onTabClose Callback method that handles tab close events. It checks the id of  
	 * 		the closed tab to determine whether it needs to open a new tab to get the 
	 *   	user back to the appropriate page.
	 * @param  {integer} 	tabId      Number of the tab that was closed
	 * @param  {object} 	removeInfo Additional information about the tab closing event
	 * @return {none}
	 */
	onTabClose: function (tabId, removeInfo) {
	 	if (debug) console.log("[LABcx.onTabClose] tab closed at: " + tabId);
	 	if (debug) console.log("[LABcx.onTabClose] active tab is at: " + this.tab_id);
	 	var self = this;
	 	var activeUrl = this.url;
	 	if (debug) console.log("[LABcx.onTabClose] current url: " + activeUrl);
	 	if ((!removeInfo.isWindowClosing) && (this.tab_id >= 0)) {
			if (tabId == this.tab_id) {
				chrome.tabs.create({active:true, url:activeUrl}, this.setActiveTab.bind(this));
			}
	 	}
	},

	/**
	 * onWindowFocusLost Callback method that handles window focus lost events. This method then checks 
	 * 		to see what is the currently focused window. If it is not the appropriate window then it 
	 *   	brings back the right window into focus by changing its state to "normal" and then back 
	 *    	to "fullscreen".
	 * @param  {object} windowId objects that contains information about currently active window
	 * @return {none}          
	 */
	onWindowFocusLost: function (windowId){
	 	if (debug) console.log("[LABcx.onWindowFocusLost] window changed to " + windowId);			
	 	if (debug) console.log("[LABcx.onWindowFocusLost] keep tabs " + this.keep_tabs);			
		if (this.keep_tabs) return;
		var updateInfo = {focused: true, state: "normal"};
		if (windowId != this.window_id && this.window_id != null) {
			chrome.windows.update(this.window_id, updateInfo, this.returnToFocus.bind(this));
		}
	},		
	
	/**
	 * onTabActiveChange Callback method that handles tab focus change events. This method then
	 * 		brings the focus back to the active tab.
	 * @param  {object} activeInfo Objects that contains information about currently active tab
	 * @return {none}           
	 */
	onTabActiveChange: function (activeInfo) {
	 	if (debug) console.log("[LABcx.onTabActiveChange] tab changed to " + activeInfo.tabId);			
	 	if (debug) console.log("[LABcx.onTabActiveChange] keep tabs " + this.keep_tabs);			
		if (this.keep_tabs) return;
		if (activeInfo.tabId != this.tab_id) {
			chrome.tabs.update(this.tab_id, {active:true}, this.setActiveTab.bind(this));
		}
	},

	/***************************
	 ** ACTION METHODS
	 ***************************/

	/**
	 * setActiveTab method used to set the active tab for the url launcher
	 * @param {object} tab Object that features a id attribte that holds the tab id, and 
	 *                     a windowId attribute that holds the windows id
	 */
	setActiveTab: function (tab) {
		if (debug) console.log("[LABcx.setActiveTab] setting active, info received ");
		if (debug) console.log(tab);
		this.tab_id = tab.id;
		this.window_id = tab.windowId;
		this.ensureInactiveTabsClosed();
		chrome.windows.get(this.window_id, this.ensureFullscreen.bind(this));
	},

	/**
	 * [getActiveTab returns the number of the currently active tab]
	 * @return {integer} [the id of the tab that is currently active]
	 */
	getActiveTab: function() {
		return this.tab_id;
	},

	/**
	* setActiveUrl method that updates the browser to go to the url provided, and then sets the
	* 		active URL to the new location.
	* @param {string} url Holds the URL that is being set as the active URL
	*/
	setActiveUrl: function (url) {
		if (debug) console.log("[LABcx.setActiveUrl] setting active url to " + this.url);
		var activeUrl = this.url = url;
		var self = this;
		chrome.tabs.query({active:true, currentWindow:true}, function(tabArray) { 
			self.setActiveTab.bind(this,tabArray[0]);
			chrome.tabs.update(this.tab_id, {url: activeUrl, active: true});
		});
	},

	/**
	 * returnToFocus this method returns a window to focus and ensures that the screen is set to fullscreen
	 * @param  {object} window Object that holds information about a window, most impotantly the window's id
	 * @return {none}      
	 */
	returnToFocus: function (window){
		if (window.id == this.window_id) {
		 	if (debug) console.log("[LABcx.returnToFocus] returning to focus ");
		 	chrome.windows.update(this.window_id, {focused: true, state: "normal"}, this.ensureFullscreen.bind(this));
	 	} 
	},

	/**
	 * removeTabs Closes down all of the tabs that are in the tabs array that is passed to it as
	 * 		an argument.
	 * @param  {array} tabArray Array that holds tab object, each one with an id attribute that holds
	 *                          the id of an open tab.
	 * @return {none}
	 */
	removeTabs: function(tabArray){
		for(tabIndex in tabArray){
			if (debug) console.log("[LABcx.removeTabs] removing tab with id " + tabArray[tabIndex].id);
			chrome.tabs.remove(tabArray[tabIndex].id);
		}
	},

	/**
	 * ensureFullscreen makes sure that a window is openned in fullscreen mode. 
	 * 		Function will recursively call itself until it confirms that the window
	 *   	has openned in fullscreen.
	 * @param  {object} window objects that contains information about the Chrome window that is being
	 *                          set to fullscreen.
	 * @return {none}
	 */
	ensureFullscreen: function (window){
		if (this.window_id < 0 || !this.go_fullscreen) return;
		if ((window.id == this.window_id) && (window.state != "fullscreen")) {
		 	if (debug) console.log("[LABcx.ensureFullscreen] going to fullscrenn ");
		 	chrome.windows.update(this.window_id, {focused: true, state: "fullscreen"}, this.ensureFullscreen.bind(this));
	 	} 
	 	else if (debug) console.log("[LABcx.ensureFullscreen] already in fullscrenn "); 		
	},

	/**
	 * ensureInactiveTabsClosed closes all tabs that are not the active tab. This function only works
	 * 		when the this.keep_tabs variable is set to false.
	 * @return {none}
	 */
	ensureInactiveTabsClosed: function () {
			if (debug) console.log("[LABcx.ensureInactiveTabsClosed]" );
		if (!this.keep_tabs) {
			if (debug) console.log("[LABcx.ensureInactiveTabsClosed] closing background tabs");
			chrome.tabs.query({active:false, currentWindow:true}, this.removeTabs.bind(this));
			chrome.tabs.query({currentWindow:false}, this.removeTabs.bind(this));
		}
	},

}


