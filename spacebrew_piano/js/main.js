/**
 * Spacebrew Piano
 *
 * A simple output example that takes in Spacebrew Range
 * messages and maps them to a piano.
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
var piano;
var octave = 5;
var noteDuration = "4n"; //Quarter note tones
var notes = ['c','c#','d','d#','e','f','f#','g','g#','a','a#','b'];

/**
 * Setup Tone.js synthesizer
 */
function setupSynth(){
	piano = new Tone.PolySynth(4, Tone.SimpleSynth, {
		// "volume" : -8,
		"oscillator" : {
			"partials" : [1, 2, 1],
		},
		"portamento" : 0.05
	}).toMaster();
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
	sb.addSubscribe("piano", "range");
	sb.addSubscribe("octave", "range");

	// setup onRange listener
	sb.onRangeMessage = onRangeMessage;
	sb.connect();
}

/**
 * Map a value from spacebrew range (0-233) to an array of notes
 * @param  {Integer} value
 */
function getNote( value ){
	var index = Math.max(0, Math.min(notes.length-1, Math.floor((value/1023) * notes.length) ) );
	return notes[index];
}

/**
 * Listen to range message, make it make tonez
 * @param  {String} name 
 * @param  {Integer} value
 */
function onRangeMessage( name, value ){
	if (name == "piano"){
		var note = getNote(value);
		console.log(note);
		piano.triggerAttackRelease( note + octave, noteDuration );
		var div = document.getElementById(note);
		div.style.transform = "translateY(10px)";
		div.style.opacity = ".5";
		setTimeout(function(){
			div.style.transform = "translateY(0px)";
			div.style.opacity = "1";
		}, 500);
	} else if ( name == "octave" ){
		octave = Math.round( value /1023 * 8);
	}
}

function setupUI(){
	// set "name" div
	var about = document.getElementById("about");
	about.innerHTML = appName;
}