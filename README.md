Spacebrew Javascript Web Library and Examples
---------------------------------------------

This repo contains the Spacebrew Library for Javascript along with documentation and example apps. Below is a brief overview about Spacbrew, followed by a short tutorial on how to use this library. 

Spacebrew
=========
Spacebrew is an open, dynamically re-routable software toolkit for choreographing interactive spaces. Or, in other words, a simple way to connect interactive things to one another. Every element you hook up to the system can subscribe to, and publish data feeds. Each data feed has a data type. There are three different data types supported by Spacebrew: boolean (true/false), number range (0-1023) or string (text). Once elements are set up, you can use a web based visual switchboard to connect or disconnect publishers and subscribers to each other. 

[Learn more about Spacebrew here.](http://docs.spacebrew.cc/)

Using Javascript Library
========================  
  
Before you get started you need to download the spacebrew library, and add it to your project's directory so that you can import it into your web app's code. To download the latest version of the library just click the "ZIP" button above.  

###1. Import javascript library into your project  
Import the javascript library into your project using a script tag in the appropriate html page. We usually include the page's javascript code in a separate file as well. This file should be imported after the library.  
  
```
<script src="path/sb.js"></script>
<script src="path/your_scripts.js"></script>

```
  
###2. Create a Spacebrew object  
In `your_scripts.js` file, the first thing you need to do is create new instance of a Spacebrew Client object using the `Spacebrew.Client` constructor and assign it to a variable or object attribute.  
  
```
var sb = new Spacebrew.Client( server, name, description );
```
  
**Constructor Parameters**
The constructor parameters, `server`, `name`, and `description`, are all optional. The Spacebrew Client library will look for the server and app name in the query string, using `server` and `name` as keys. If server is not specified in the query string or constructor, then the app will attempt to connect to a Spacebrew server hosted locally. The name will default to the app's full URL, if no name is provided via the query string or constructor.   
  
The description will remain empty if it is not specified via the constructor. If you want to define the description via the constructor while defining the server and app name via the query string you'll have to use the notation shown below. The reason being, the server and name defined via the constructor would otherwise precedence over server and app names defined via the query string.  
  
```
var sb = new Spacebrew.Client( undefined, undefined, "this is what this app does" );
```
  
###3. Configure Data Subscription and Publication Feeds  
The next step is adding the subscription and publication data feeds. Each one needs to be labelled and assigned an appropriate data type - `"string"`, `"range"`, of `"boolean"`. You can also optionally define a default value for any publication feed. 

```
sb.addPublish( name, type, default );
sb.addSubscribe( name, type );
```


###4. Define lifecycle and message event handler methods
Spacebrew offers lifecycle event hooks for connection open and close events - `onOpen`, and `onClose`; and for incoming message events of each data type - `onStringMessage`, `onRangeMessage`, of `onBooleanMessage`. You need to define the message handler methods in order to capture data from your subcriptions data feeds.

```
sb.onStringMessage = onString;
sb.onRangeMessage = onRange;
sb.onBooleanMessage = onBoolean;
sb.onOpen = onOpen;
sb.onClose = onClose;
```

###5. Connect to Spacebrew
Now that you have configured the Spacebrew object it is time to connect to the Spacebrew server. 

```
sb.connect();
```

###6. Send messages
The `send` method enables you to publish messages via one of the publication data feeds. It accepts three mandatory parameters, a channel name, a data type, and a value. The value needs to correspond to the data type, otherwise the message will be ignored by the server.

```
sb.send( name, type, value )
```


