// screenshot test
var x11 = require('x11');
var fs = require('fs');
var ImageJS=require("imagejs");

x11.createClient(function(err, display) {
    var X = display.client;
    var root = display.screen[0].root;
    X.GetGeometry(root, function(err, clientGeom) {
        width = clientGeom.width;
        height = clientGeom.height;
        X.GetGeometry(root, function(err, attr) {
	        X.GetImage(2, root, 0, 0, attr.width, attr.height, 0xffffffff, function(err,image) {
	            //console.log(image.data);
	            var img_bmp=new ImageJS.Bitmap({
				    width: attr.width,
				    height: attr.height,
				    data: image.data
				});
	            console.log(new ImageJS.Bitmap());
	            img_bmp.writeFile('lama.jpg');
	        });
	    });
    });
}).on('error', function(err) {
    console.log(err);
});
