var text = $("#html-output")[0];
var html_begin = "<html><head><meta charset='utf-8'></head><body>"
var html_end = "</body></html>"
xml_serializer = new XMLSerializer
html_output = html_begin + xml_serializer.serializeToString(text) + html_end;

$('#btn-export-html').click( function(){
  	var blob = new Blob([html_output], {type: "text/html;charset="+ document.characterSet});
  	saveAs(blob, "export.html");
});

$('#btn-export-pdf').click( function(){
	var specialElementHandlers = {
		'#editor': function(element, renderer){
			return true;
		}
	};

	var doc = new jsPDF();
	doc.fromHTML(text, 15, 15, {
		'width': 170
	});
	doc.save('export.pdf');
});

$('#btn-export-md').click( function(){
	var text = $("#md-input").val();
  	var blob = new Blob([text], {type: "text/plain;charset=utf-8"});
  	saveAs(blob, "export.md");
});