/**
 * SmartMirror JS
*/
var Monate = new Array("Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember");
var Wochentage = new Array("Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag");
Date.prototype.getDatumFormatiert = function() {
    var t = this.getDate();
    var m = this.getMonatString();
	var wt = this.getWochentagString();
    t = (t < 10) ? "0" + t : t;

    return wt + ", " + t + ". " + m + " " + this.getFullYear();
};
Date.prototype.getUhrzeit = function() {
    var h = this.getHours();
    var m = this.getMinutes();
	//var s = this.getSeconds();
    h = (h < 10) ? "0" + h : h;
    m = (m < 10) ? "0" + m : m;
	
    return h + ":" + m;
};
Date.prototype.getDatum = function() {
	var tag = this.getDate();
	var monat = this.getMonth() + 1;
	var jahr = this.getFullYear();
	tag = (tag < 10) ? "0" + tag : tag;
	monat = (monat < 10) ? "0" + monat : monat;
	
	return tag + "." + monat + "." + jahr;
};
Date.prototype.getWochentagString = function() {
	return Wochentage[this.getDay()];
};
Date.prototype.getMonatString = function() {
	return Monate[this.getMonth()];
};

// TODO: Audioausgabe noch nicht fuer RPi unterstuetzt
//var Sprachausgabe = function() {
//	this.voices = [];
//};
//Sprachausgabe.prototype.init = function() {
//	if ('speechSynthesis' in window) {
//		// wait on voices to be loaded before fetching list
//        // http://stackoverflow.com/questions/21513706/getting-the-list-of-voices-in-speechsynthesis-of-chrome-web-speech-api
//        window.speechSynthesis.onvoiceschanged = function() {
//			this.voices = window.speechSynthesis.getVoices();
//        };
//		
//		return true;
//	}
//	// SpeechSynthesis nicht unterstuetzt
//	return false;
//};
//Sprachausgabe.prototype.sag = function(satz) {
//	var msg = new SpeechSynthesisUtterance();
//	msg.voice = this.voices[1];
//    msg.lang = 'de-DE';
//    msg.voiceURI = 'Google Deutsch';
//    msg.volume = 1; // 0 to 1
//    msg.rate = 1; // 0.1 to 10
//    msg.pitch = 0; // 0 to 2
//    msg.text = satz;
//	//msg.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == 'Whisper'; })[0];
//    speechSynthesis.speak(msg);
//};

var Config = "";

var Wetter = {
    beschreibung: "",
	temperatur: "",
	iconPfad: ""
};

// TODO Audioausgabe
//var speechSynth = new Sprachausgabe();

var getWetter = function() {
	$.ajax({
        type: "GET",
        url:  "http://api.openweathermap.org/data/2.5/weather",
		//url:  "http://api.openweathermap.org/data/2.5/forecast",
        data: "id=" + Config.cityid +
			  "&units=metric" +
			  "&lang=de" +
              "&appid=" + Config.appid
    }).done(function(response) {
        //response = JSON.parse(response); hier nicht, weil schon JSON ankommt
		
		/* Forecast
		Wetter.beschreibung = response.list[0].weather[0].description
		Wetter.temperatur = response.list[0].main.temp;
		Wetter.iconPfad = "http://openweathermap.org/img/w/" + response.list[0].weather[0].icon + ".png";
		*/
		Wetter.beschreibung = response.weather[0].description;
		var temp = String(response.main.temp);
		// letzte Stelle abschneiden, wenn 2 Nachkommastellen
		Wetter.temperatur = temp.length > 3 ? temp.substring(0, temp.length - 1) : temp;
		Wetter.iconPfad = "http://openweathermap.org/img/w/" + response.weather[0].icon + ".png";
		
		// setup
		$("#wetter").html("");
		var wetterContent = "";
		wetterContent += "<div class=\"grad\"><span>" + Wetter.temperatur + "&deg;</span>";
		wetterContent += "<img src=\"" + Wetter.iconPfad + "\" class=\"wetterIcon\"</img></div>";
		wetterContent += "<div class=\"descr\">" + Wetter.beschreibung + "</div>";
		$("#wetter").append(wetterContent);
		$("#wetter").fadeIn(1000);
    }).fail(function() {
		$("#fehler").append("<p>FEHLER: Wetter kann nicht geholt werden</p>");
	});
};

/**
* RSS muss ueber Server geholt werden wegen Same-Origin-Policy
*/
var getRSSFeed = function() {
	$.get("/get_spiegel_rss", function(data) {
		$("#news").html("");
		var newsContent = "";
		items = $(data).find("item");
		for (var i = 0; i <= items.length; i++) {
			var el = $(items[i]);
			newsContent += "<li>" + el.find("title").text() + "</li>";
		}
		$("#news").append(newsContent);
		$("#news").show();
		$("#news").children().hide();
		fadingScroller($('#news li:first'));
	}).fail(function() {
		$("#fehler").append("<p>FEHLER: News-Feed kann nicht gelesen werden</p>");
	});
};

/**
 * News-fading
 * Quelle: https://www.sitepoint.com/community/t/fading-or-vertical-scroll-news-content/4827/2
 */
function fadingScroller($el) {
	$el.show('fast');
	$el.animate({'opacity': 1}, 5000);
	$el.animate({'opacity': 0}, 1000);
	$el.hide('slow', function () {
		$el.parent().append($el);
//		$el.show();
//		$el.animate({'opacity': 1}, 1000);
		setTimeout(function () {
			return function () {
				fadingScroller($('#news li:first'));
			};
		}(), 1000);
	});
}

function getCPUTemperatur() {
	$.get("/get_cpu_temp", function(data) {
		$("#cpu").html("");
		var cpuTemp = 'CPU-Temp: ' + data.substr(5, 4) + '&#x2103;' // parsen
		$("#cpu").append(cpuTemp);
		// setTimeout hier sicherer, da child_process laenger dauern kann
		setTimeout(function () {
			return function () {
				getCPUTemperatur();
			};
		}(), 3000);
	}).fail(function() {
		$("#fehler").append("<p>FEHLER: CPU-Temperatur kann nicht gelesen werden</p>");
	});
}

var init = function(callback) {
	$.getJSON("/get_config", function(data) {
		Config = data;
	}).done(function() {
		$("#willkommen").fadeIn(3000, function() {
			$("#willkommen").fadeOut(3000, function() {
				getWetter();
				getRSSFeed();
				// TODO Audioausgabe
//				if (!speechSynth.init()) {
//					$("#fehler").append("<p>FEHLER: SpeechSynthesis wird vom Browser nicht unterst&uuml;tzt</p>");
//				}
				callback.call();
			});
		});
	}).fail(function() {
		$("#fehler").append("<p>FEHLER: Konfiguration kann nicht gelesen werden</p>");
	});
};

$(document).ready(function() {
	$("#willkommen").hide();
	$("#wetter").hide();
	$("#news").hide();
	var weckerFertig = false;
	
	init(function() {
		setInterval(function() {
			getWetter();
			getRSSFeed();
		}, 1800000); // jede halbe Stunde
	
		setInterval(function() {
			var d = new Date();
		
			$("#datum").html("");
			$("#datum").append("<div class=\"datumClass\">" + d.getDatumFormatiert() + "</div>");
		
			$("#uhrzeit").html("");
			$("#uhrzeit").append("<div class=\"uhrzeitClass\"><h1>" + d.getUhrzeit() + "</h1></div>");
			
			// TODO: Audioausgabe
//			if (Config.wecker.aktiv == true 
//					&& !weckerFertig
//					&& Config.wecker.zeit == d.getUhrzeit()) {
//				speechSynth.sag("Guten Morgen " + Config.user + "! Es ist " + d.getWochentagString() + " der "
//					+ d.getDate() + ". " + d.getMonatString() + " " + d.getFullYear() + ", "
//					+ d.getHours() + " Uhr und " + d.getMinutes() + " Minuten.");
//				weckerFertig = true;
//			} else if (Config.wecker.aktiv == true
//					&& weckerFertig
//					&& Config.wecker.zeit != d.getUhrzeit()) {
//				// Wecker nach 24h wieder klingeln lassen
//				weckerFertig = false;
//			}
		}, 1000);
		
		// TODO: Ohne Weckerfunktion, da ohne Audioausgabe
		// Falls sich Konfiguration aendert -> reboot
//		setInterval(function() {
//			checkConfig();
//		}, 42000); // 42 Sekunden :P
		
		getCPUTemperatur();
	});
});
