APP OVERVIEW
============================

App: 		spacrebrew_url_launcher
Component: 	url_launcher chrome extension
Project: 	spacrebrew_url_launcher
Team: 		Julio Terra
Date: 		October 23, 2012

Description: 
This chrome extension is the spacebrew Url Launcher app. This component provides the core functionality of the app, it accepts a string message from spacebrew via websockets, checks if that message is a URL, and if so, loads the URL in Chrome. This app can also function as a tab manager that always keeps a chrome tab in focus, and deletes all inactive tabs. Please read the instructions below to learn how to use it.

System Requirements:
* Mac OSX (not tested on any other platform)
* Chrome


HOW TO USE
============================

Setting Up the URL Launcher:
----------------------------

1)  Install the Chrome Extension on the Chrome browser that will be running this app. Just follow
	the "Adding Extensions to Google Chrome" directions featured below.
2)  Navigate to any URL in Chrome and include all of the appropriate query string options in
	your URL. Please refer to the section query string option descriptions below.
3)  Go to the admin page for the Spacebrew server that your app is linked to and confirm that the app is
	showing up. Then link your app to any appropriate outlet.

4)	In order to be able to get access to status and debug messaging for the url launcher we recommend that you 
	start up the URL launcher chrome extension with the URL launcher webapage. To do so you will need to start 
	a webserver in the webapp directory of the url_launcher. Here is how to do this using a python SimpleHTTPServer:
		1. Navigate to the url_launcher webapp directory in terminal
		2. Type command "python -m SimpleHTTPServer" and press enter/return
		3. This opens a webserver at port 8000 on localhost

Adding Extensions to Google Chrome:
----------------------------

1)	launch the instance of Chrome where this app will run
2)	navigate to chrome://extensions
3)	check "Developer" (top right)
4)	click on the load unpackaged extension button and navigate the root directory of the url launcher
5)	click "Accept"


Query String Options:
----------------------------

The following option flags (true/false) can be set via the query string to change behavior of this chrome extension:

	* active: when set to true this option tells the url launcher to listen to changes in the query string
		options, and to mark the tab of the current page as the active tab. the url launcher ads the query 
		string "active=true" to all urls that it launches. 
	* url_launcher: if url_launcher is set to "true" in the query string then this chrome extension will 
		function as a url launcher. otherwise, this extension will just keep the active tabs focused and 
		the app in fullscreen, and won't connect to interactive spaces. Defaults to "false".
    * go_fullscreen: when set to "false" the url_launcher does not automatically go to 
    	fullscreen. Defaults to "true".
	* keep_tabs: when "keep_tabs" is set to "true" the url_launcher does not delete all
  		tabs other than the active tab. Defaults to "false".
 	* timeout: time in milliseconds used to set time limit for an idle timer. When a web page is idle the url_launcher
 		reloads the active page and sends a true boolean message to Spacebrew via the "im_bored" outlet. Defaults to 0.
	* debug: when set to "true" turns on js console messages. Defauls to "false".

 	* [DEPRECATED] loose_focus: when "loose_focus" is set to "true" the url_launcher does not always bring back
		the focus back to the active tab. Defaults to "false".

The following options configure the connection to Spacebrew. You don't need to specify these items if you want to connect to the server using the default name, or if the server is running on 'localhost':

	* name: holds the name for this application that will show up on the spacebrew admin interface. 
		Defaults to "sbUrlLauncher".
	* server: holds the hostname of the spacebrew server to which this application should connect.
		Please do not include the port number. Defaults to "localhost".

Query String Samples:
----------------------------

Here is are a few query string samples, along with what they mean:

1)	Query string that starts up the URL launcher by settings url_launcher=true, sets the 
	current tab to active by setting active=true. This only works if you are using a 
	a spacebrew server that is running on your localhost, as this is the default behavior
	when a server is not specified in the query string. 

	"[ANY URL]?url_launcher=true&active=true&"
	
2)  Query string that starts up the URL launcher by settings url_launcher=true, sets the 
	current tab to active by setting active=true, sets the hostname of the Spacebrew 
	servers by setting server=serverName, tells the app NOT to go to fullscreen with 
	go_fullscreen=false, and sets keep_tabs=true so that the app will keep inactive tabs 
	open and let users navigate away from the active tab.

	"[ANY URL]?url_launcher=true&active=true&server=serverName&go_fullscreen=false&keep_tabs=true&"

**	It is good to add the trailing "&" to the query string because if you are loading 
	a side at a directory level (there is no file extension at the end of the url) a 
	forward slash is sometimes appended to the last query element.
