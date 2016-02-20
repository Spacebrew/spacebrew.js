/**
 * Spacebrew Synth
 *
 * A simple output example that takes in Spacebrew Range
 * messages and turns them into funky tones.
 */

/* Main Spacebrew object */
var sb;

/** String: Name of your app */
var appName;

window.onload = function () {
	
	setupSynth();
	setupSpacebrew();
	setupUI();
}

// synth objects
var synthOne, synthTwo, synthThree;
var noteDuration = "8n"; //8th note tones
var bpm = 120;

// helpers: debug divs for each synth
var synthOneDiv, synthTwoDiv, synthThreeDiv;

/**
 * Setup Tone.js synthesizer
 */
function setupSynth(){
	synthOne = new Tone.SimpleSynth().toMaster();
	synthTwo = new Tone.SimpleSynth().toMaster();
	synthThree = new Tone.SimpleSynth().toMaster();

	Tone.Transport.start();
}

/**
 * Setup Spacebrew object & range catcher
 */
function setupSpacebrew(){
	appName = "SbSynth";

	// randomize name
	var random_id = "0000" + Math.floor(Math.random() * 10000);
	appName = appName + ' ' + random_id.substring(random_id.length-4);

	// setup spacebrew connection
	sb = new Spacebrew.Client();
	sb.name(appName);

	// add subscribers
	sb.addSubscribe("synthOne", "range");
	sb.addSubscribe("synthTwo", "range");
	sb.addSubscribe("synthThree", "range");
	sb.addSubscribe("bpm", "range");

	// setup onRange listener
	sb.onRangeMessage = onRangeMessage;
	sb.connect();
}

// quick util
function randomColor( max ){
	function ranMax(){
		return Math.floor(Math.random() * max);
	}
	return "rgb(" + ranMax() + "," + ranMax() +"," + ranMax() + ")";
}

/**
 * Listen to range message, make it make tonez
 * @param  {String} name 
 * @param  {Integer} value
 */
function onRangeMessage( name, value ){
	if (name == "synthOne"){
		synthOne.triggerAttackRelease( value, noteDuration );
		synthOneDiv.style.backgroundColor = randomColor(value/1023 * 255);
	} else if (name == "synthTwo"){
		synthOne.triggerAttackRelease( value, noteDuration );
		synthTwoDiv.style.backgroundColor = randomColor(value/1023 * 255);
	} else if (name == "synthThree"){
		synthOne.triggerAttackRelease( value, noteDuration );
		synthThreeDiv.style.backgroundColor = randomColor(value/1023 * 255);
	} else if (name == "bpm"){
		// quickly ramp to this bpm
		Tone.Transport.bpm.rampTo(parseInt(value), .1);
	}
}

function setupUI(){
	// set "name" div
	var about = document.getElementById("about");
	about.innerHTML = appName;

	synthOneDiv = document.getElementById("displayOne");
	synthTwoDiv = document.getElementById("displayTwo");
	synthThreeDiv = document.getElementById("displayThree");

	function resizeDivs(){
		var h = window.innerWidth /3 * .8;
		h += "px";

		synthOneDiv.style.width = h;
		synthTwoDiv.style.width = h;
		synthThreeDiv.style.width = h;

		synthOneDiv.style.height = h;
		synthTwoDiv.style.height = h;
		synthThreeDiv.style.height = h;
	}

	window.onresize = resizeDivs;
	resizeDivs();

	// fix for sound on mobile!
	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
		var start = document.getElementById("mobileStart");
		start.style.visibility = "visible";
		start.style.display = "block";
		start.addEventListener("touchend", function(e){
			e.preventDefault();
			Tone.startMobile();
			document.body.removeChild(start);
		});
	}
}