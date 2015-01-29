var saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    var data_type = "plain";
    return function (data, fileName, type) {
        if(type == "html"){ data_type = "html"};
        blob = new Blob([data], {type: "text/"+ data_type +";charset="+ document.characterSet}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());


$('#btn-export-html').click( function(){
    var text = $("#html-output")[0];
    var css = "<style type='text/css'>body{font-family: sans-serif;font-size:100%;}code, kbd, pre, samp {font-family: monospace, serif;}</style>"
    var html_begin = "<html><head><meta charset='utf-8'>"+ css + "</head><body>"
    var html_end = "</body></html>"
    xml_serializer = new XMLSerializer
    html_output = html_begin + xml_serializer.serializeToString(text) + html_end;
    saveData(html_output, "export.html", "html");
});

$('#btn-export-md').click( function(){
    var text = $("#md-input").val();
    saveData(text, "export.md", "md")
});

$('#btn-export-pdf').click( function(){
    var specialElementHandlers = {
        '#ignorePDF': function(element, renderer){
            return true;
        }
    };
    var text = $("#html-output")[0];
    var doc = new jsPDF();
    doc.fromHTML(text, 15, 15, {
        'width': 170
    });
    doc.save('export.pdf');
});

$('#btn-export-print').click( function(){
    $('#print').html( $('.html-output').html() );
    $('#print').show();
    window.print();
    $('#print').empty();
    $('#print').hide();
});