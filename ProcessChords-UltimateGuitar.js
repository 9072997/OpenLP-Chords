// (C) 2017 Jon Penn, Distributed under GPLv2 or later (your choice)
function processChords(chords, lyrics) {
	// pad shorter string with spaces
	while(chords.length > lyrics.length) lyrics += ' ';
	while(lyrics.length > chords.length) chords += ' ';

	var prevWasChord = false;
	var buffer = "";

	for(var i = 0; i < lyrics.length; i++) {
		buffer += lyrics[i];
		if(chords[i] == ' ') {
			if(prevWasChord) {
				document.write("{/lc}");
			}
			document.write(buffer);
			buffer = "";
			prevWasChord = false;
		} else {
			if(prevWasChord) {
				document.write(chords[i]);
			} else {
				document.write("{lc}" + chords[i]);
			}
			prevWasChord = true;
		}
	}
	if(prevWasChord) {
		document.write("{/lc}");
	}
	document.write("<br>");
}

function processLabel(line) {
	line = line.toLowerCase();
	if     (line.includes("verse") ) document.write("---[Verse:"  + verse++  + "]---<br>");
	else if(line.includes("chorus")) document.write("---[Chorus:" + chorus++ + "]---<br>");
	else if(line.includes("bridge")) document.write("---[Bridge:" + bridge++ + "]---<br>");
	else if(line.includes("intro") ) document.write("---[Intro:"  + intro++  + "]---<br>");
	else if(line.includes("ending")) document.write("---[Ending:" + ending++ + "]---<br>");
	else                             document.write("---[Other:"  + other++  + "]---<br>");
}

var verse  = 1;
var chorus = 1;
var bridge = 1;
var intro  = 1;
var ending = 1;
var other  = 1;
document.getElementsByClassName("js-tab-content")[0].addEventListener('contextmenu', function(ev) {
	var lines = document.getElementsByClassName("js-tab-content")[0].textContent.split('\n');
	var lineCounter = 0;
	var songStarted = false;
	for(var i = 0; i < lines.length; i++) { // loop over all lines of input
		var line = lines[i];
		if(line.replace(/\s/g, '').length == 0) { // blank line
			continue;
		} else if(line[0] == '[' | line[0] == '(' | line[0] == '-') { // line is a label
			processLabel(line);
			songStarted = true;
		} else if(songStarted) {
			var chords = line;
			var lyrics;
			lyrics = lines[++i]; // pull next line and advance count
			processChords(chords, lyrics);
		}
	}
});

document.body.contentEditable='true';
document.designMode='on';
