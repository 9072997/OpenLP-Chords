// ==UserScript==
// @name         OpenLP SongSelect Download
// @namespace    http://thriveuark.com/jonpenn/ssimport
// @version      0.2
// @description  Downloads songs from SongSelect as OpenLP XML files
// @author       Jon Penn
// @match        https://songselect.ccli.com/Songs/*
// @grant        none
// ==/UserScript==
// (C) 2017 Jon Penn, Distributed under GPLv2 or later (your choice)
var verseSectionCount        = 1;
var chorusSectionCount       = 1;
var bridgeSectionCount       = 1;
var instrumentalSectionCount = 1;
var introSectionCount        = 1;
var endingSectionCount       = 1;
var otherSectionCount        = 1;
function getSectionCode(title) {
	title = title.toLowerCase();
	if     (title.includes("verse") )       return 'v' + verseSectionCount++;
	else if(title.includes("chorus"))       return 'c' + chorusSectionCount++;
	else if(title.includes("bridge"))       return 'b' + bridgeSectionCount++;
	else if(title.includes("instrumental")) return 'p' + instrumentalSectionCount++;
	else if(title.includes("intro") )       return 'i' + introSectionCount++;
	else if(title.includes("ending"))       return 'e' + endingSectionCount++;
	else                                    return 'o' + otherSectionCount++;
}

// source: http://stackoverflow.com/questions/2897619
function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}

function xmlEncode(inString) {
	var sanatizedString = "";
	for(var i = 0; i < inString.length; i++) {
		if(inString.charCodeAt(i) <= 127) {
			sanatizedString += inString.charAt(i);
		} else {
			sanatizedString += '&#' + inString.charCodeAt(i) + ';';
		}
	}
	return sanatizedString;
}

// source: http://stackoverflow.com/questions/6480082
function addButton(text, onclick, cssObj) {
	cssObj = cssObj || {position: 'fixed', bottom: '7%', right:'4%', 'z-index': 3};
	let button = document.createElement('button'), btnStyle = button.style;
	document.body.appendChild(button);
	button.innerHTML = text;
	button.onclick = onclick;
	btnStyle.position = 'absolute';
	Object.keys(cssObj).forEach(key => btnStyle[key] = cssObj[key]);
	return button;
}
// END FUNCTIONS

function downloadOpenLpXML() {
	var sections = document.getElementsByClassName('cproSongSection');
	if(sections.length == 0) {
		alert('Could not find any song lyrics. Maby the song is copy protected.');
		return false;
	}
	// loop over each section of the song
	var songData = Object();
	songData.title = document.getElementsByClassName('cproTitle')[0].textContent;
	songData.key = document.getElementsByClassName('cproSongKey')[0].textContent;
	songData.sections = Array();
	for(var sectionNum = 0; sectionNum < sections.length; sectionNum++) {
		var section = sections[sectionNum];
		var sectionTitle = section.getElementsByClassName('cproComment')[0].textContent;
		songData.sections[sectionNum] = Object();
		songData.sections[sectionNum].title = sectionTitle;
		var lines = section.getElementsByClassName('cproSongLine');
		songData.sections[sectionNum].lines = Array();
		for(var lineNum = 0; lineNum < lines.length; lineNum++) {
			songData.sections[sectionNum].lines[lineNum] = Array();
			var line = lines[lineNum];
			var pieces = line.childNodes;
			var canonicalPieceNum = 0;
			for(var pieceNum = 0; pieceNum < pieces.length; pieceNum++) {
				var piece = pieces[pieceNum];
				if(piece.nodeType == Node.ELEMENT_NODE) {
					var chordElement = piece.getElementsByClassName('chord')[0];
					if(typeof chordElement == 'undefined') continue;
					var lyricElement = piece.getElementsByClassName('chordLyrics')[0];
					if(typeof lyricElement == 'undefined') continue;
					songData.sections[sectionNum].lines[lineNum][canonicalPieceNum] = Object();
					songData.sections[sectionNum].lines[lineNum][canonicalPieceNum].hasChord = true;

					var pieceChord = chordElement.textContent;
					songData.sections[sectionNum].lines[lineNum][canonicalPieceNum].chord = pieceChord;
					var pieceText = lyricElement.textContent.replace(' - ', '').replace(/ +/g, ' ');
					songData.sections[sectionNum].lines[lineNum][canonicalPieceNum].text = pieceText;
					canonicalPieceNum++;
				} else if(piece.nodeType == Node.TEXT_NODE) {
					songData.sections[sectionNum].lines[lineNum][canonicalPieceNum] = Object();
					songData.sections[sectionNum].lines[lineNum][canonicalPieceNum].hasChord = false;
					var pieceText = piece.textContent.replace(' - ', '').replace(/ +/g, ' ');
					songData.sections[sectionNum].lines[lineNum][canonicalPieceNum].text = pieceText;
					canonicalPieceNum++;
				} // else idk what this is, so i'm just going to skip it
			}
		}
	}

	var songXML =
		'<?xml version="1.0" encoding="UTF-8"?>' + "\n" +
		'<song xmlns="http://openlyrics.info/namespace/2009/song" ' +
			'version="0.7" ' +
			'createdIn="Jons Song Select Importer 0.2" ' +
			'modifiedIn="Jons Song Select Importer 0.2">' +
			'<properties>' +
				'<titles>' +
				'<title>' + songData.title + '</title>' +
				'</titles>' +
				'<authors>' +
				'<author>' + songData.key + '</author>' +
				'</authors>' +
			'</properties>' +
			'<format>' +
				'<tags application="OpenLP">' +
					'<tag name="lc">' +
						'<open>&lt;span style="position: absolute;"&gt;&lt;span style="position: relative; top: -2em; color: yellow; font-size: 50%;"&gt;</open>' +
						'<close>&lt;/span&gt;&lt;/span&gt;</close>' +
					'</tag>' +
					'<tag name="hc">' +
						'<open>&lt;span style="position: absolute;"&gt;&lt;span style="position: relative; top: -3em; color: yellow; font-size: 50%;"&gt;</open>' +
						'<close>&lt;/span&gt;&lt;/span&gt;</close>' +
					'</tag>' +
				'</tags>' +
			'</format>' +
			'<lyrics>';
	var sections = songData.sections;
	for(var sectionNum = 0; sectionNum < sections.length; sectionNum++) {
		var section = sections[sectionNum];
		sectionCode = getSectionCode(section.title);
		songXML += "\n" + '<verse name="' + sectionCode + '"><lines>';
		var lines = section.lines;
		for(var lineNum = 0; lineNum < lines.length; lineNum++) {
			var line = lines[lineNum];
			songXML += "\n" + '<line>';
			var pieces = line; // these is no line metadata, so...
			var insturmental = true;
			for(var pieceNum = 0; pieceNum < pieces.length; pieceNum++) {
				var piece = pieces[pieceNum];
				if(piece.hasChord) {
					songXML += '<tag name="lc">';
					songXML += xmlEncode(piece.chord);
					songXML += '</tag>';
				}
				songXML += xmlEncode(piece.text);
				if (piece.text.replace(/\s/g, "").length > 0) insturmental = false;
			}
			if(insturmental) songXML += 'INSTURMENTAL';
			songXML += '</line>';
		}
		songXML += '</lines></verse>';
	}
	songXML +=
			'</lyrics>' +
		'</song>';
	songXML = songXML.replace(/ +/g, ' ');
	songXML = songXML.replace(/ (<tag name="lc">[^<]*<\/tag>) /g, ' $1');
	songXML = songXML.replace(/<\/tag>( ?)<tag name="lc">/g, '$1');
	// alternate hc and lc
	var isHc = false;
	songXML = songXML.replace(/<tag name="lc">/g, function alternateHcLc() {
        isHc = !isHc;
		if(isHc) {
			return '<tag name="hc">';
		} else {
			return '<tag name="lc">';
		}
	});

	var filename = songData.title + ' (' + songData.key + ').xml';
	download(filename, songXML);
}

addButton('Download OpenLP XML', downloadOpenLpXML);
