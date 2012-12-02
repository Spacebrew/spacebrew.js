/*!
 *  Slideshow :: Main  *
 * 
 *  Initializes the main variables that are used in this webapp, opens and configures the SpaceBrew connection,
 *  registers all listeners for user input, and controls the slideshow.
 *  
 *  <br />Copyright (C) 2012 LAB at Rockwell Group http://lab.rockwellgroup.com
 *
 * @filename    main.js
 * @author      The Lab (Julio)
 * @modified    11/02/2012
 * @version     1.0.0
 * 
 */

var sb = {};
    sb.connection = {};           // spacebrew connection
    sb.connected = false;         // flag that identifies when spacebrew is connected

var qs = {};                      // holds all data that is read from the query string
    qs.href = window.location.href;
    qs.name = window.getQueryString('name') || "sbSlideshow" + (window.getQueryString('id') ? (" " + window.getQueryString('id')) : "");	// name of app in spacebrew
    qs.server = window.getQueryString('server') || 'localhost';					    // name of spacebrew server
    qs.debug = (window.getQueryString('debug') == "true") ? true : false;		// debug flag

var model = {};
    model.imgs = [];              // holds the imgs that have been added to the slideshow
    model.inputs = { "img_urls": {}, "next": {}, "prev": {}, "play_pause": {}, "speed": {} };

    model.bounds = {};            // holds the bounds for use with the map function
    model.bounds.speed = { low: 0, high: 1000 };
    model.bounds.interval = { low: 30000, high: 0 };

var state = {};
    state.new_data = false;       // flag that identifies when a new image has been received  
    state.loaded = true;          // flag that is set to true once an image has been loaded
    state.started = false;        // flag that identifies when slideshow has been started
    state.img_timer = null;       // holds the timer that controls the slideshow timing
    state.text_timer = null;      // holds the timer that controls visibilty of the text messages
    state.range_interval = null;  // holds the timer that helps manage input for speed

    state.active = {};            // holds the variables associated to the active states of the app
    state.active.url = "";        // holds the url of the image that is currently being displayed
    state.active.count = 0;       // holds the total number of image switches that have happened
    state.active.index = 0;       // holds the index of the current img in the model.imgs array
    state.active.prev_index = 0;  // holds the index of the previous img
    state.active.id = "";         // holds the id of the DOM of element from the active img
    state.active.interval = 10000; // holds the period of time in milliseconds between each new image load

var controls = {};                // 
    controls.speed = 800;         // holds the speed of the slideshow (range 0 to 1000)
    controls.txt_fade = 1000;     // holds the duration of fade in and out of DOM elements
    controls.txt_timeout = 5000;  // holds the amount of time that txt stays visible after a click
    controls.url_regex = /[-a-zA-Z0-9@:%_\+.~#?&\/\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/\/=]*.[png|jpg|jpeg|gif])?/gi;


var debug = debug || qs.debug || false; // flag to identify if debug messages should be output

$(window).bind("load", function() {
  if (debug) console.log("[main.js] DEBUGGING IS ON")
  setTimeout(function() { window.scrollTo(0, 1) }, 100);
  setInterval(function() { displayStatusMsg() }, 50);

  setup();
  setupDeviceSpecific();
  registerUserEventListeners();
  displayNextImg();
});


/**
 * setup Sets up the SpaceBrew connection, configures subscribe and publish configurations, and 
 *    links the onString callback method. Also builds the input forms once connections has been 
 *    established.
 * @return {none} 
 */
function setup (){
  var status_msg = "Attempting to connect to the spacebrew server at '" + qs.server + "'";
  var description = "A simple tool for transforming text messages in Spacebrew. " +
                    "It just responds to messages by sending other messages.";

  // Display status message on browser window
  $("#statusMsgDiv p").text(status_msg);

  // spacebrew set-up
  initInputsHash();

  // spacebrew set-up
  if (debug) console.log("[setup] setting up connection to Spacebrew");
  sb.connection = new Spacebrew.Client(qs.server, qs.name, description);
  for (var input in model.inputs) sb.connection.addSubscribe( input, model.inputs[input].type );
  sb.connection.onStringMessage = onMessage.bind(this);
  sb.connection.onRangeMessage = onMessage.bind(this);
  sb.connection.onBooleanMessage = onMessage.bind(this);
  sb.connection.onOpen = onOpen.bind(this);
  sb.connection.onClose = onClose.bind(this);
  sb.connection.connect();
}

/**
 * setupDeviceSpecific Updates css elements for iPhones.
 * @return {none} 
 */
var setupDeviceSpecific = function () {
  if( navigator.userAgent.match(/iPhone/i) ) {
    $("header").css("width", "280px");
    $("header").css("padding", "20px 20px");
    $("header h1").css("width", "280px");
    $("header p").css("width", "280px");

    $("#contentListDiv").css("width", "280px");
    $("#contentListDiv").css("padding", "20px 20px");
    $("#contentListDiv h1").css("width", "280px");
    $("#contentListDiv li").css("width", "280px");
    $("#contentListDiv ul").css("width", "280px");

    $(".contentItem").css("width", "280px");
    $(".contentItem span").css("width", "80px");
    $(".contentItem a").css("width", "200px");

    $("#statusMsgDiv").css("width", "280px");
    $("#statusMsgDiv").css("padding", "20px 20px");
    $("#statusMsgDiv h1").css("width", "280px");
    $("#statusMsgDiv p").css("width", "280px");

    $("body").css("min-height", (screen.height + "px"));

  } else {
    console.log("[setupDeviceSpecific] navigator userAgent ", navigator.userAgent);
  }  
}

/**
 * initInputsHash Creates the model.inputs hashlist, so that it can feature links to the 
 *   callback methods that are defined in this file.
 * @return {none} 
 */
var initInputsHash = function () {
  model.inputs = {
    "img_urls": {
      type: "string",
      callback: onUrl,
      value: ""
    },
    "next": {
      type: "boolean",
      callback: onNext,
      value: false   
    },
    "prev": {
      type: "boolean",
      callback: onPrev,
      value: false   
    },
    "play_pause": {
      type: "boolean",
      callback: onPlayPause,
      value: false   
    },
    "speed": {
      type: "range",
      callback: onSpeed,
      value: 800   
    }
  };
  console.log("[initInputsHash] initialize model.inputs ", model.inputs);
}

/**
 * displayStatusMsg Handles display of information about the app, such as title and description, 
 *   and the apps current state, such as list of images and spacebrew connection status. Method is
 *   called repeatedly, though it only updates the DOM element when data has changed.
 * @return {none} 
 */
var displayStatusMsg = function () {

  // if no new data is avaialble then exit method
  if (!state.new_data) return;

  // remove all existing content items from the form
  $('#contentListDiv .contentItem').remove();

  for (var i in model.imgs) {
    // set the initial value for each field
    var newimgIndex = "contentItem-" + i;
    $newEle = $("#lib .contentItem").clone();
    $newEle.attr("id", newimgIndex);
    $newEle.find("span").text("image #" + i + ": ");
    $newEle.find("a").text(model.imgs[i].url);
    $newEle.find("a").attr("href", model.imgs[i].url);
    $newEle.appendTo("#contentList");
  }
  state.new_data = false;
}

/**
 * displayNextImg Loads the next image on the slide show by fading it in in front of current img. 
 *   Once new image is loaded it removes the older img from the DOM.
 * @params {Boolean} reverse Flag that identifies when slideshow movement is backwards 
 * @return {none} 
 */
function displayNextImg(reverse) {
  var debug = true;

  // if the model.imgs array has multiple messages
  if (model.imgs.length > 1) {
    // if slideshow started then update index counter, otherwise set started flag to true
    if (state.started) imgIndexUpdate(reverse);
    else state.started = true;

    // display the active img
    if (debug) console.log("[displayNextImg] display the active img from slideshow, index: " + state.active.index );  
    displayActiveImg();
  } 

  // if the model.imgs array has just one message
  else if (model.imgs.length == 1) {
    if ($(".backgroundImg")) {
      var $imgCur = $("#img_" + state.active.index);
      if ($imgCur.length < 1) {
        $(".backgroundImg").remove();
        if (debug) console.log("[displayNextImg] display the single active img " );  
        displayActiveImg();
      }
    }  
  } 

  // if the model.imgs array has no messages
  else {
    if (debug) console.log("[displayNextImg] no img to display " );  
    $(".backgroundImg").remove();
  }

  // update the show_timer, which calls the load next img message again.
  if (state.loaded) {
    if (state.img_timer) clearTimeout(state.img_timer);
    state.img_timer = setTimeout(displayNextImg, state.active.interval);    
  }
}

/**
 * displayActiveImg Displays the currently active image from the model.imgs array. This image is pointed
 *   to by the variable state.active.index
 * @return {none} 
 */
function displayActiveImg() {
  if (state.active.index >= model.imgs.length) return;

  // create id for new img
  state.active.id = ("img_" + state.active.index);
  if (debug) console.log("[displayActiveImg] create img with id: " + state.active.id + " url: " + model.imgs[state.active.index].url);  

  // assign current img's DOM element to a variable and create a DOM element for new image
  var $imgCur = $("#img_" + state.active.prev_index);
  var $imgNew = $("<img />", { "src": model.imgs[state.active.index].url, 
                               "class": "backgroundImg",
                               "id": state.active.id});
  $imgNew.css("z-index", 10);

  $imgNew.on("load", [$imgCur, $imgNew], function ( event ) {
    var $imgCur = event.data[0];
    var $imgNew = event.data[1];
    if (debug) console.log("[displayActiveImg] loaded img with id: ", $imgCur);  

    // add data to DOM element then resize it based on current browser and img sizes
    $imgNew.data("index", state.active.index);
    imgResize($imgNew);
    $imgNew.hide().prependTo("#background");
    $imgNew.fadeIn(2000, function() { 
      if ($imgCur) $imgCur.remove(); 
      $imgNew.css("z-index", 0);  // move new image to appropriate z-index
    });
  });
}

/**
 * imgIndexUpdate Updates the show.index variables, which identifies what img is currently being
 *   displayed. Called by the displayNextImg button while in the process of creating DOM elements for 
 *   new images.
 * @params {Boolean} reverse Flag that identifies when slideshow movement is backwards 
 * @return {Integer} Index location of newly-updated slideshow image 
 */
function imgIndexUpdate (reverse) {
  var direction = 1;
  if (reverse) direction = -1;

  state.active.prev_index = state.active.index;
  state.active.count += direction;
  state.active.index = Math.abs(state.active.count) % model.imgs.length;

  return state.active.index;
}

/**
 * imgResize Resize a DOM element that contains an img to fit in current browser window. Method
 *   checks the dimensions of the img and browser window to detected whether the pictures width
 *   or height should be matched to that of the window.
 * @param  {Object} $imgNew DOM object that will be resized. DOM element should include a data
 *                          attribute called "index", which is used to identify the img being
 *                          resized in the model.imgs array.
 * @return {none}         
 */
function imgResize($imgNew) {
  var imgIndex = $imgNew.data("index");
  if (!model.imgs[imgIndex]) {
    console.log("[imgResize] no img in the model.imgs array with id: " + imgIndex);  
    return;
  }
    console.log("[imgResize] resizing img in model.imgs array with id: ", imgIndex);  

  var wHeight = $(window).height();
  var wWidth = $(window).width();
  var wRatio = wWidth / wHeight;
  var imgRatio = model.imgs[imgIndex].width / model.imgs[imgIndex].height;
  var imgPos = {x:0, y:0};

  // the img width should be matched to the window width
  if (wRatio >= imgRatio) {
    model.imgs[imgIndex]._width = wWidth;
    model.imgs[imgIndex]._height = Math.floor(wWidth / imgRatio);
    imgPos.y = ( wHeight / 2 ) - ( model.imgs[imgIndex]._height / 2 );
    imgPos.x = 0;
  // the img height should be matched to the window height
  } else {
    model.imgs[imgIndex]._height = wHeight;
    model.imgs[imgIndex]._width = Math.floor(wHeight * imgRatio);
    imgPos.x = ( wWidth / 2 ) - ( model.imgs[imgIndex]._width / 2 );
    imgPos.y = 0;
  }

  $imgNew.css( "top", imgPos.y + "px" );
  $imgNew.css( "left", imgPos.x + "px" );
  $imgNew.css( "height", model.imgs[imgIndex]._height + "px" );
  $imgNew.css( "width", model.imgs[imgIndex]._width + "px" );

  console.log("[imgResize] resized and centered img with id: " + imgIndex);  
}

/**
 * onUrl Adds a new image to the model.imgs array, along with the appropriate meta data such as
 *   img size, both native (width and height) and active (_width and _height).
 * @param {String} url String containing a URL that points to an img
 */
var onUrl = function( url ) {
  if ( !url.match(controls.url_regex) ) return;

  // check if url already exists in the slideshow array
  for (var i in model.imgs) {
    if (model.imgs[i].url.indexOf(url) == 0) return;
  }

  // clear out hiddenImg staging area, then create a DOM element with the new img 
  $("#hiddenImgDiv .hiddenImg").remove();
  var $img = $('<img />', { 'src': url, 'class': 'hiddenImg' }).appendTo("#hiddenImgDiv");

  // when image create a new model.imgs array item
  $img.on("load", function ( event ) {
    // check that the img was loaded before adding it to the imgs array
    if (event.target.width > 0 && event.target.height > 0) {
      var new_msg = {
        width: event.target.width,    // native width
        height: event.target.height,  // native height
        _width: 0,                    // active width
        _height: 0,                   // active height
        url: url                      // img url
      };

      model.imgs.push(new_msg);
      state.new_data = true;      
      console.log("[onUrl] new item added to array: ", new_msg);  
    }
  });
}

/**
 * onNext Handles messages from the "next" spacebrew inlet. Moves to the next image on slideshow
 *   whenever a message is received regardless of value. 
 * @param  {Boolean} flag Variable does not impact logic
 * @return {none}      
 */
var onNext = function( flag ) {
  console.log("[onNextPrev] flag received ", flag);
  displayNextImg();
}

/**
 * onPrev Handles messages from the "next" spacebrew inlet. Moves to the next image on slideshow
 *   whenever a message is received regardless of value.  
 * @param  {Boolean} flag Variable does not impact logic  
 * @return {none}      
 */
var onPrev = function( flag ) {
  console.log("[onNextPrev] flag received ", flag);
  displayNextImg( true );
}

/**
 * onPlayPause Handles messages from the "play_pause" inlet. It alternates between play and pause every
 *   time it is called, regardless of the value of the parameter. 
 * @param  {Boolean} flag Variable does not impact logic
 * @return {none}      
 */
var onPlayPause = function( flag ) {
  state.loaded = !state.loaded;
  console.log("[onPlayPause] is playing state: ", state.loaded);  
  if (!state.loaded) {
    if (state.img_timer) clearTimeout(state.img_timer);
  } else {
    displayNextImg();  
  }
}

/**
 * onSpeed Handles messages from the "speed" inlet. It receives an integer, that it uses to set the 
 *   current speed of the slideshow.
 * @param  {Integer} speed Speed of the slideshow, expecting a number between 0 and 1023 where higher
 *                         numbers increase the speed of the slideshow. At it's fastest the slideshow
 *                         will jump to a new image every second, at it's slowest every 60 seconds. 
 * @return {none}       
 */
var onSpeed = function( speed ) {
  if (state.img_timer) clearTimeout(state.img_timer);
  if (state.range_interval) clearTimeout(state.range_interval);

  controls.speed = speed;
  state.active.interval = controls.txt_fade + mapVal(controls.speed, model.bounds.speed.low, model.bounds.speed.high,
                                                    model.bounds.interval.low, model.bounds.interval.high);

  console.log("[onSpeed] speed ", speed + " interval " + state.active.interval);  
  state.range_interval = setTimeout(displayNextImg, 250);    
}

/**
 * onWindowResize Callback method that is called whenever the window is resized. This method makes
 *   sure that the img size is adjusted as the size of the browser window changes. 
 * @param  {Object} e Information about the event, including the updated height and width of 
 *                    the resized window.
 * @return {none}   
 */
function onWindowResize( event ) {
  // var wHeight = $(window).height();
  // var wWidth = $(window).width();
  console.log("[onWindowResize] window has been resized: ", event);  
  imgResize($("#" + state.active.id));
}

/**
 * registerUserEventListeners Registers click, touch, and resize event listeners used to bring the 
 *   app overview and readings into (and then out of) visibility, and to control sizing of imgs.
 * @return {none} 
 */
var registerUserEventListeners  = function () {
  console.log("[registerUserEventListeners] registering click event to make text visible ");

  $(document).on("click touchstart", function ( event ) {
    console.log("[registerUserEventListeners:click] click received ", event);
    displayNextImg();  
    setFadeOutTimer(controls.txt_timeout);
    $("#contentWrapper").fadeIn(controls.txt_fade); 
  });

  $(window).on("resize", onWindowResize);
  setFadeOutTimer(controls.txt_timeout);
}

/**
 * mapVal Maps a value in a similar way to the Arduino and Processing map method. It takes a value, along
 *   with source min and max values, and target min and max values. Then it converts the value from the 
 *   source to the target range.
 * @param  {Integer} value      The value that will be mapped.
 * @param  {Integer} source_min The minimum value for the source range.
 * @param  {Integer} source_max The maximum value for the source range.
 * @param  {Integer} target_min The minimum value for the target/outgoing range.
 * @param  {Integer} target_max The maximum value for the target/outgoing range.
 * @return {Integer}            The mapped value.
 */
var mapVal = function(value, source_min, source_max, target_min, target_max) {
  if (!(value && source_min && source_max && target_min  && target_max)) "missing parameter";
  if (isNaN(value) || isNaN(source_min) || isNaN(source_max) || isNaN(target_min) || isNaN(target_max)) "not a number";
  if (value > source_max) value = source_max;
  if (value < source_min) value = source_min;
  var source_delta = source_max - source_min;
  var target_delta = target_max - target_min;
  var value_abs = value - source_min;
  var mapped_abs = value_abs * (target_delta / source_delta);
  var mapped_final = target_min + mapped_abs;

  return Math.round(mapped_final);
}

/**
 * setFadeOutTimer Sets a new idle timer and saves it in the variable state.text_timer. When a new
 *   request is received, all timeouts are cleared before the new timeout timer is created.
 * @param {Integer} timeout Duration in milliseconds for the timeout timer that is being set.
 */
var setFadeOutTimer = function (timeout) {
  if (state.text_timer) clearTimeout(state.text_timer);
  state.text_timer = setTimeout(function () {
    $("#contentWrapper").fadeOut(controls.txt_fade);   
  }, timeout);  
}

/**
 * htmlForTextWithEmbeddedNewLines Converts all '\n' in a string to '<br>' in preparation for
 *    the string to be injected into an html page.
 * @param  {String} text The incoming string that will be processed (with '\n's)
 * @return {String}      The processed string (with '<br>'s)
 */
function htmlForTextWithEmbeddedNewlines(text) {
    var htmls = [];
    var lines = text.split(/\n/);
    for (var i = 0 ; i < lines.length ; i++) {
        htmls.push(
            $(document.createElement('div')).text(lines[i]).html()
        );
    }
    return htmls.join("<br>");
}




