/**
 * Spacebrew YouTube
 *
 * A funky YouTube player for Spacebrew.
 * Code based on example here:
 * https://developers.google.com/youtube/iframe_api_reference#Loading_a_Video_Player
 */

/* Main Spacebrew object */
var sb;

/**
 * The name of your app. Change this!
 * @type {String}
 */
var appName = "SbYouTube";

/**
 * Often times, you want to randomize your name.
 * Change this to 'false' if not–or just delete
 * the code in setupSpacebrew();
 * @type {Boolean}
 */
var doRandomName = true;

/**
 * YouTube player
 * @type {[type]}
 */
var player = null;
var playerReady = false;

/**
 * Set up spacebrew & do other stuff 
 * when the window is ready.
 */
window.onload = function () {
	setupSpacebrew();
	setupUI();

	// setup YouTube
	setupYT();
}

/**
 * Setup Spacebrew object & range catcher
 */
function setupSpacebrew(){

	if ( doRandomName ){
		// randomize name
		var random_id = "0000" + Math.floor(Math.random() * 10000);
		appName = appName + ' ' + random_id.substring(random_id.length-4);
	}

	// setup spacebrew connection
	sb = new Spacebrew.Client();
	sb.name(appName);

	// add publishers and subscribers
	// sb.addPublish("name", "range");
	sb.addSubscribe("videoID", "string");
	sb.addSubscribe("position", "range");
	sb.addSubscribe("playStop", "boolean");

	// setup listeners
	sb.onBooleanMessage = onBooleanMessage;
	sb.onStringMessage = onStringMessage;
	sb.onRangeMessage = onRangeMessage;
	sb.onCustomMessage = onCustomMessage;
	sb.connect();
}

/**
 * @param  {String} name 
 * @param  {Boolean} value
 */
function onBooleanMessage( name, value ){
	// don't do anything until the video is playin'
	if ( !playerReady ) return;

	if (name == "playStop"){
		if ( value == true ){
			player.playVideo();
		} else {
			player.pauseVideo();
		}
	}
}

/**
 * @param  {String} name 
 * @param  {String} value
 */
function onStringMessage( name, value ){
	if (name == "videoID"){
		// check if someone sent a URL or videoID
		if ( value.indexOf("http") == 0 ){
			var vIndex = value.indexOf("?v");
			if ( vIndex >= 0 ){
				// find le video id
				var id = value.substring(vIndex+3);
				player.loadVideoById(id);
			} else {
				console.log("Got a bad URL "+value);
			}
		} else {
			player.loadVideoById(value);
		}
	}
}

/**
 * @param  {String} name 
 * @param  {Number} value
 */
function onRangeMessage( name, value ){
	if ( name == "position" ){
		// map range to duration
		var seconds = player.getDuration() * (value/1023);
		player.seekTo(seconds);
	}
}

/**
 * @param  {String} name 
 * @param  {String} value
 */
function onCustomMessage( name, value ){
	// do some stuff!
	console.log("Custom: "+name+":"+value);
}

/**
 * Setup some stuff in the DOM. 
 * You can delete this, if you want.
 */
function setupUI(){
	// set "name" div
	var about = document.getElementById("appname");
	about.innerHTML = appName;
}

function setupYT(){
	// This code loads the IFrame Player API code asynchronously.
	var tag = document.createElement('script');
	tag.src = "https://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

//	This function creates an <iframe> (and YouTube player)
//	after the API code downloads.
function onYouTubeIframeAPIReady() {
	player = new YT.Player('container', 
		{
		  height: '768',
		  width: '1024',
		  videoId: '2XID_W4neJo',
		  events: 
		  {
		    'onReady': onPlayerReady,
		    'onStateChange': onPlayerStateChange
		  }
		}
	);
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
	event.target.playVideo();
}

// 	The API calls this function when the player's state changes.
//	The function indicates that when playing a video (state=1),
function onPlayerStateChange(event) {
	if (event.data == YT.PlayerState.PLAYING) {
		playerReady = true;
	}
}