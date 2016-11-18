$(document).ready(function(){
	console.log('Loaded draw pixmap test');
	if(typeof require == "undefined")
	{
		$('#nodeactive_ok_boc').css('background-color','red');
		console.log('Node js dose not exist. Ignoring node load.');
	}
	else
	{
		$('#nodeactive_ok_boc').css('background-color','green');
		$('#btn_show_devtools').click(function(){
			require('nw.gui').Window.get().showDevTools();
		});

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
		        	var ctx=$('#test_canvas')[0].getContext('2d');
		        	// var width=100;
		        	// var height=100;
		        	// var image_data=new ImageData(width,height);
		        	// var image_src=image_data.data;
		        	// console.log(image_src.length);
		        	// var i=0;
		        	// var maxi=width*height*4-1;
		        	
		        	function do_update_to_canvas(){
		        		// image_src[i]=0;
		        		// image_src[i+1]=0;
		        		// image_src[i+2]=0;
		        		// image_src[i+3]=256;
		        		//ctx.putImageData(new ImageData(image_src,width,height),0,0);
		        		// console.log('Written image data.');
		        		
		        		// i=i+4;
		        		// if(i>maxi)
		        		// 	i=0;


		        		X.GetImage(2, root, 0, 0, attr.width, attr.height, 0xffffffff, function(err,image) {
			            //console.log(image.data);
			   //          var img_bmp=new ImageJS.Bitmap({
						//     width: attr.width,
						//     height: attr.height,
						//     data: image.data
						// });
			   //          console.log(new ImageJS.Bitmap());
			   //          img_bmp.writeFile('lama.jpg');

			            // updating the canvas... if possible.
			            //
			            //
			            //ctx.putImageData(,attr.width,attr.height),0,0);
			            	//var arr=Uint8ClampedArray.from(image.data);
			            	//img_data=new ImageData(,attr.width,attr.height);
			            	//console.log('Updated canvas.');
			            	//setTimeout(do_update_to_canvas,1);
			            	// createImageBitmap(ctx.createImageData(image.data),0,0,image.width,image.height).then(function(sprite){
			            	// 	ctx.drawImage(sprite,0,0);
			            	// 	console.log('read/write image from root window.');
			            	// });
			   				//data_array=new Uint8Array(image.data,0,3*attr.width*attr.height);
			   				//img_data=new ImageData(Uint8ClampedArray.from(image.data),attr.width,attr.height);
			   				//ctx.putImageData(img_data,0,0);
			   				img_data=new ImageData(new Uint8ClampedArray(image.data),attr.width,attr.height);
			   				ctx.putImageData(img_data,0,0);
			   				//console.log(img_data);
			   				//console.log(image.data.length/(attr.height*attr.width));
			   				setTimeout(do_update_to_canvas,50);
			        	});
		        	}
		        	do_update_to_canvas();
			    });
		    });
		}).on('error', function(err) {
		    console.log(err);
		});
	}
});
