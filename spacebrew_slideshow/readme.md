APP OVERVIEW
============================

App: 		spacebrew_slideshow
Project: 	spacebrew_javascript_examples
Team: 		Julio Terra from LAB at Rockwell Group
Date: 		November 2, 2012

Description: 
This simple app functions like a collaborative picture slideshow that can be controlled via spacebrew. It accepts strings containing links to images via one inlet, called img_urls; next, prev, and play_pause boolean commands via inlets with those same names; and an integer value for slideshow speed, via the speed inlet.

System Requirements:
* Mac iOS and OSX (not tested on any other platform)
* Web browser (Safari on iOS, iPhone 3GS plus for gyrometer)


HOW TO USE
============================

Setting Up the iPhone Events Forwarder:
----------------------------

1)	To load the spacebrew_slideshow app on your local computer you will need to start a webserver
	from the spacebrew_slideshow folder. The simplest way to do this on a Mac is using a python 
	script called SimpleHTTPServer. Here is how to use this script:
		1. Navigate to the spacebrew_slideshow directory in the Terminal app
		2. Type the command "python -m SimpleHTTPServer 8000" and press return

2)	Open a web browser on your computer and navigate to the spacebrew_slideshow app by 
	going to "http://localhost:8000/". If you are using a Spacebrew server that is running on the localhost 
	the app should show up with the name sbSlideshow. If you want to connect to another Spacebrew 
	server read the next step, find out how to do so by reading the query string options section below. 

	To load this web app on an iPhone that is connected to the same network as the computer from which the
	web app is being served, you will need to find your computer's ip address. On OSX go to System
	Preferences -> select Network -> make Wifi is selected -> click on the Advanced button -> select the
	TCP/IP tab -> look for IPv4 Address. 

	Once you have the ip address just switch out 'localhost' for the ip address in the url mentioned above.
	When you run this app on your phone you will always need to specify the location of the server, as described
	in step 3, below. If the ip address for both this app and the Spacebrew server was '10.0.1.14', then the
	url I would use on my phone would be: 

	"http://10.0.1.14:8000/index.html?server=10.1.14" 

3)	To connect to another server you need to add "server=SERVER_NAME" to the query string. For example, 
	if you were trying to connect to a Spacebrew server at "ec2-184-72-140-184.compute-1.amazonaws.com"
	you would go to: 

	"http://localhost:8000/index.html?server=ec2-184-72-140-184.compute-1.amazonaws.com"

Query String Options:
----------------------------

The following option flags (true/false) can be set via the query string to change behavior of this chrome extension:

	* name: holds the name for this application that will show up on the spacebrew admin interface. 
		Defaults to "ColoredScreen".
	* server: holds the hostname of the spacebrew server to which this application should connect.
		Please do not include the port number. Defaults to "localhost".
	* debug: when set to "true" turns on js console messages. Defauls to "false"
