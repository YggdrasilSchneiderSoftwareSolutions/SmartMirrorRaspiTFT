/**
 * Admin JS
 * Datepicker Doku:
 * https://weareoutman.github.io/clockpicker/
 */
var Config = "";

$(document).ready(function() {
	$.getJSON("/get_config", function(data) {
		Config = data;
	}).done(function() {
		// Userdaten
		if (Config.user !== "") {
			$("#username").val(Config.user);
		}
		// Stadt
		if (Config.cityid !== "") {
			$("#cityid").val(Config.cityid);
		}
		// Wecker
		if (Config.wecker.aktiv == true) {
			$("#weckerAn").attr("checked", "checked");
		} else {
			$("#weckerAus").attr("checked", "checked");
		}
		// Datetimepicker
		$('.clockpicker').clockpicker();
		$("#weckerZeit").val(Config.wecker.zeit);
	}).fail(function() {
		$("#statusMsg").html("");
		$("#statusMsg").append("<span class=\"fehler\"><span class=\"glyphicon glyphicon-floppy-remove\"></span> " +
				"FEHLER: Konfiguration kann nicht gelesen werden</span>");
	});
	
	$("#adminButtonSave").click(function(e) {
		e.preventDefault();
		$.ajax({
	        type: "POST",
	        url:  "/set_wecker",
	        data: $("#weckerForm").serialize()
	    }).done(function(response) {
	    		var data = JSON.parse(response);
	    		var status = "";
	    		if (data.status = true) {
	    			$("#statusMsg").html("");
	    			var weckerAktiv = data.active == true ? "aktiviert" : "deaktiviert";
	    			status += "<span class=\"erfolg\"><span class=\"glyphicon glyphicon-floppy-saved\"></span> " +
	    					"Wecker um " + data.time + " gestellt und " + weckerAktiv + "</span>";
	    			$("#statusMsg").append(status);
	    		} else {
	    			$("#statusMsg").html("");
	    			status += "<span class=\"fehler\"><span class=\"glyphicon glyphicon-floppy-remove\"></span> " +
	    					"Fehler beim speichern des Weckers</span>";
	    			$("#statusMsg").append(status);
	    		}
	    });
	});
});