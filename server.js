/************************************************************************/
/***  Einfacher Node-JS Server auf Port 8081                          ***/
/***  Bietet REST-Schnittstelle (GET) fuer                            ***/
/***	- RSS-Feed von Spiegel Online (Original RSS XML)              ***/
/***	- Bereitstellen von Config-Daten als JSON                     ***/
/***	- CPU-Temperatur                                              ***/
/***	- Konfiguration der Anwendung (Admin-Ui + config-File)        ***/
/***  REST wird mit Express-Framework realisiert                      ***/
/***                                                                  ***/
/***  Copyright (c) Yggdrasil Schneider Software Solutions            ***/
/************************************************************************/
var http = require('http');
var https = require('https');
var url = require('url');
var express = require('express');
var app = express();
var fs = require('fs');
var config = require('./config.json');
var bodyParser = require('body-parser'); // Wird nur fuer POST gebraucht
var exec = require('child_process').exec;

// Create application/x-www-form-urlencoded parser for POST-Requests
var urlencodedParser = bodyParser.urlencoded({ extended: true });

app.use(express.static(__dirname + '/public'));

var configChanged = false;

app.get('/index.html', function(req, res) {
	log('Received GET on /index.html', false);
	res.sendFile( __dirname + "/index.html" );
});

app.get('/admin.html', function(req, res) {
	log('Received GET on /admin.html', false);
	res.sendFile( __dirname + "/admin.html" );
});

/**
* Verhindern, dass GET auf favicon.ico auf 404 laueft
*/
app.get('/favicon.ico', function(req, res) {
    res.sendStatus(204); // No Content
});

/**
* Gibt an, ob sich an der Config etwas geaendert hat.
* configChanged wird beim holen der Config wieder auf false gesetzt.
*/
app.get('/check_config', function(req, res) {
	log('Received GET on Check Config', false);
	res.setHeader('Content-Type', 'application/json');
	response = {
		change : configChanged
	};
	res.send(JSON.stringify(response));
});

/**
* Config als JSON senden, damit z.B. APPID nicht im Client-Code steht
*/
app.get('/get_config', function(req, res) {
	log('Received GET on Config', false);
	configChanged = false;
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify(config));
});

/**
* RSS-Feed von Spiegel holen (HTTP)
* return: XML des Feeds
*/
app.get('/get_spiegel_rss', function(req, res) {
	log('Received GET on Spiegel-RSS', false);
	// create options with pathinfo
	var options = {
		host: 'www.spiegel.de',
		path: '/schlagzeilen/tops/index.rss'
	};
	
	// GET auf Spiegel RSS-Feed
	var body = '';
	var rssReq = http.get(options, function(rssRes) {
		//log('STATUS: ' + rssRes.statusCode, false);
		//log('HEADERS: ' + JSON.stringify(rssRes.headers), false);
		// Buffer the body entirely for processing as a whole.
		rssRes.on('data', function(chunk) {
			body += chunk;
		}).on('end', function() {
			res.end(body);
		}).on('error', function(e) {
			log('ERROR in get_spiegel_rss: ' + e.message, true);
		});
	});
});

app.get('/get_cpu_temp', function(req, res) {
	var isLinux = process.platform === "linux";
	if (isLinux) {
		var child = exec("/opt/vc/bin/vcgencmd measure_temp", function (error, stdout, stderr) {
			  if (error !== null) {
			    log('exec child_process error: ' + error, true);
			  }
			  res.end(stdout);
		});
	} else {
		res.end("temp=k.A.'C"); // temp can't be determined
	}
});

/**
 * Wecker-Einstellungen per POST entgegennehmen und speichern
 * return: status der Verarbeitung
 */
app.post('/set_wecker', urlencodedParser, function(req, res) {
    var weckerZeit = req.body.weckerZeit;
    var aktiv = req.body.weckerAn == 'an' ? true : false; 
    
    wecker = {
    		"wecker" : {
    			"aktiv" : aktiv,
        		"zeit" : weckerZeit
    		}
    };
    config['wecker'] = wecker['wecker'];
    configChanged = true;
    var success = true;
    fs.writeFile('./config.json', JSON.stringify(config), function(err) {
    	if (err) {
    		success = false;
			console.error(err);
		}
    });
    
    response = {
    		status : success,
    		active : aktiv,
    	    time : weckerZeit
    };
    res.end(JSON.stringify(response));
});

var log = function(logString, toFile) {
	if (config.trace == "true") {
		console.log(logString);
	}
	
	if (toFile) {
		fs.appendFile('smartmirror_log.txt', new Date() + '=>' + logString + '\n', function(err) {
			if (err) {
				return console.error(err);
			}
		});
	}
};

var server = app.listen(8081, function() {
  var host = server.address().address; // is ::, meaning any IPv6 address
  var port = server.address().port;

  log('Server app [running on ' + process.platform + '], listening at http://' + host + ':' + port, false);
});