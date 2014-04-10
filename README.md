Spacebrew Javascript Web Library and Core Examples
--------------------------------------------------

This repo contains the Spacebrew Library for Javascript along with documentation and example apps. This library was designed to work on front-end (browser) envrionments, and back-end (server) environments. Below is a brief overview about Spacbrew, followed by a short tutorial on how to use this library. 

Current Version: 	1.4.0  
Latest Update: 		April 8, 2014
Main Contributors: 	LAB at Rockwell Group, Brett Renfer, Eric Eckhard-Ishii, Julio Terra, Quin Kennedy

Jump to:
* [Using the Spacebrew Javascript Library](#using-javascript-library)  
* [Spacebrew Library Examples](#javascript-library-examples)  
* [Using the Spacebrew Admin Library](#using-spacebrew-admin-mix-in)  
  
About Spacebrew
===============
Spacebrew is an open, dynamically re-routable software toolkit for choreographing interactive spaces. Or, in other words, a simple way to connect interactive things to one another. Every element you hook up to the system can subscribe to, and publish data feeds. Each data feed has a data type. There are three different data types supported by Spacebrew: boolean (true/false), number range (0-1023) or string (text). Once elements are set up, you can use a web based visual switchboard to connect or disconnect publishers and subscribers to each other. 

[Learn more about Spacebrew here.](http://docs.spacebrew.cc/)

Using Javascript Library
========================  
  
Before you get started you need to download the spacebrew library, and add it to your project's directory so that you can import it into your web app's code. To download the latest version of the library just click the "ZIP" button above.  

###1. Import javascript library into your project  
Import the javascript library into your project using a script tag in the appropriate html page. We usually include the page's javascript code in a separate file as well. This file should be imported after the library.  
  
```
<script src="path/sb-1.4.0.js"></script>
<script src="path/your_scripts.js"></script>
```
  
###2. Create a Spacebrew object  
In `your_scripts.js` file, the first thing you need to do is create new instance of a Spacebrew Client object using the `Spacebrew.Client` constructor and assign it to a variable or object attribute.  
  
```
var sb = new Spacebrew.Client( server, name, description, options );
```
  
**Constructor Parameters**
The constructor parameters, `server`, `name`, `description`, and `options` are all optional. The options parameter supports three options: `port`, an integer that specifies the port number of the spacebrew server, `debug`, a boolean value that turns on console messages when set to true, and `reconnect`, a boolean variable that turns off automatic reconnect when set to false. When running in a browser, the Spacebrew Client library will look for the server hostname, app name, app description, and server port setting in the query string; using `server`, `name`, `description`, `port` as keys.  
  
If server is not specified in the query string or constructor, then the app will attempt to connect to a Spacebrew server hosted locally. The name will default to the app's full URL, if no name is provided via the query string or constructor. The description will remain blank if no description is specified. If you want to connect to the cloud server just point spacebrew to `sandbox.spacebrew.cc`.  
  
###3. Configure Base Name and Description Feeds   
You can also set the base app name and description using the `Spacebrew.Client` library's `name()` and `description()` methods. The app's name and description must be set before the Spacebrew connection is established.  
  
```
sb.name("myApp")
sb.description("this is a spacebrew app.")
```
       
###4. Configure Data Subscription and Publication Feeds  
The next step is adding the subscription and publication data feeds. Each one needs to be labelled and assigned an appropriate data type - `"string"`, `"range"`, `"boolean"` (custom data types are also supported, the names for these data types are arbitrary, as long as the publisher and subscriber feature the same name). You can also optionally define a default value for any publication feed. 

```
sb.addPublish( name, type, default );
sb.addSubscribe( name, type );
```
  
###5. Define lifecycle and message event handler methods
Spacebrew offers lifecycle event hooks for connection open and close events - `onOpen`, and `onClose`; and for incoming message events of each data type - `onStringMessage`, `onRangeMessage`, of `onBooleanMessage`. You need to define the message handler methods in order to capture data from your subcriptions data feeds.
  
```
sb.onStringMessage = function onString( name, value ) {};
sb.onRangeMessage = function onRange( name, value ) {};
sb.onBooleanMessage = function onBoolean( name, value ) {};
sb.onCustomMessage = function onBoolean( name, value, type ) {};
sb.onOpen = function onOpen() {};
sb.onClose = function onClose() {};
```
  
###6. Connect to Spacebrew
Now that you have configured the Spacebrew object it is time to connect to the Spacebrew server. 
  
```
sb.connect();
```
  
###7. Send messages  
The `send` method enables you to publish messages via one of the publication data feeds. It accepts three mandatory parameters, a channel name, a data type, and a value. The value needs to correspond to the data type, otherwise the message will be ignored by the server.  
    
```
sb.send( name, type, value )
```

Javascript Library Examples
===========================

Here is a list of the core examples that are included in this repo. These examples were designed to help you get started building web apps that connect to other applications, objects and spaces via Spacebrew.

###Button (Boolean Example)
Web app with a button that publishes a boolean value every time the button is clicked. It also subscribes to boolean messages, which change the web app's background color.
  
###Slider (Range Example)
Web app that subscribes and publishes range values and features three sliders that are used to send and display range values to and from Spacebrew.  
  
###String Example
Web app with a text box publishes text messages to Spacebrew. App also subscribes to string messages, which are displayed underneath the text box.

###Dice (Custom Data Type Example)
Web app that publishes and subscribes to the custom data type called dice. It features a button that generates a random number between 1 and 6.
  
Spacebrew Admin Mix-in
=======
  
You can also integrate admin functionality directly into yor spacebrew client applications using the Spacebrew admin library along with the standard javascript mix-in. Please note that this mix-in is still in early development phases, which means that it will change and evolve a lot over the coming months. we will document the process for adding admin functionality into your client apps in the coming weeks.  

###Spacebrew Admin Mix-in Version Details
Current Version: 	0.1.4 
Latest Update: 		March 17, 2014   
Main Contributors: 	Julio Terra, Brett Renfer  

Using Spacebrew Admin Mix-in
==============================   
  
Before you get started you need to download the spacebrew admin mix-in, and add it to your project's directory so that you can import it into your web app's code. This mix-in is included in the same folder as the Spacebrew javascript library.  

###1. Import javascript mix-in into your project  
Import the javascript library into your project using a script tag in the appropriate html page. You should import this file after the Spacebrew library.  
  
```
<script src="path/sb-1.2.0.js"></script>
<script src="path/sb-admin-0.1.4.js"></script>
```
  
###2. Extend Spacebrew object with admin mix-in
After you create the Spacebrew object you need to extend it with the admin mix-in by calling the `extend()` method as illustrated below.

```
sb = new Spacebrew.Client();
sb.extend(Spacebrew.Admin);
```
  
###3. Define admin event handler methods
Several event hooks are provided by the Spacebrew admin mix-in. Please refer to the source file for more details regarding the arguments associated to each hook.

```   
// triggered when new client connects to server.  
sb.onNewClient = function( client ) {};

// triggered when existing client is reconfigured.  
sb.onUpdateClient = function( client ) {};

// triggered when an existing client disconnects from server.  
sb.onRemoveClient = function ( name, address) {};

// triggered when a route is added or removed.  
sb.onUpdateRoute = function ( action, pub, sub )
```  
  
###4. Add and remove routes
The `addRoute` and `removeRoute` methods enable you to add and remove routes between any client apps that are connected to the Spacebrew server. These methods require the following information for publisher and subscriber associated to each route: client name, address, pub or sub name. You can provide this information as individual parameters, or group them together into separate publisher and subscriber parameter objects. 
   
```   
sb.addRoute( publisher, subscriber )
sb.addRoute( pub_client, pub_address, pub_name, sub_client, sub_address, sub_name )
```

```
sb.removeRoute( publisher, subscriber )
sb.removeRoute ( pub_client, pub_address, pub_name, sub_client, sub_address, sub_name )
```  

The four methods below enable you to easily create and remove routes that involve the client app with the embedded admin functionality.  
   
```
sb.addSubRoute( pub_name, sub_client, sub_address, sub_name )
sb.addPubRoute( sub_name, pub_client, pub_address, pub_name )
```  
  
```
sb.removeSubRoute( pub_name, sub_client, sub_address, sub_name )
sb.removePubRoute( sub_name, pub_client, pub_address, pub_name )
```  
  
License  
=======  
  
The MIT License (MIT)  
Copyright © 2012 LAB at Rockwell Group, http://www.rockwellgroup.com/lab  
  
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:  
  
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.  
  
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.  

