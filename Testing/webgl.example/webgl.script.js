$(function(){
	var width=300;
	var height=300;
	// setting up webgl.
	var vertex=getSource('vertex.cc'); // the code for positioning in webgl.
	var fragment=getSource('fragment.cc'); // the code for coloring pixels in webgl.
	//console.log('WegGL program source: \n',vertex,fragment);

	// creating the webgl context,
	$('#canvas').width(width).height(height).attr('width',width+'px').attr('height',height+'px');
	var gl=$('#canvas')[0].getContext('webgl');
	if(gl==null)
	{
		console.error('Cannot create webgl context. Please verefy webgl is supported.');
		return;
	}
	else console.log('WebGL context creatd.');

	// creating the webgl program.
	var glp=createWebGLProgramFromSource(gl,vertex,fragment);

	// set the current program.
	gl.useProgram(glp);

	console.log('WebGL program created and set as current.');

	// Create a pointer to the position of the variable (the place it is stored)

	// attributes can be fed by buffers and are changeable.
	var positionAttributeLocation = gl.getAttribLocation(glp, "a_position");

	// uniforms are constants.
	var resolutionUniformLocation = gl.getUniformLocation(glp, "u_resolution");

	// Create the buffer to feed the attribute.
	var positionBuffer=gl.createBuffer();

	// setting the resolution.
	gl.uniform2f(resolutionUniformLocation, width, height);

	// we bind the buffer, (so we can access it) - kinda like creating a global pointer.
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	var padding=10;
	// three 2d coordinants.
	// var positions = new Float32Array([
	// 	padding, padding,
	// 	width-padding, padding,
	// 	, 30,
	// 	10, 30,
	// 	80, 20,
	// 	80, 30,
	// ]);

	// create the viewport.
	gl.viewport(0,0,300,300);

	// clear the canvas
	gl.clearColor(0, 0, 0, 0); // clear and transparent.

	// not really clear on this.
	gl.clear(gl.COLOR_BUFFER_BIT);

	// enable the attribute we set, possitionAttributeLocation, to apply to vertex.
	gl.enableVertexAttribArray(positionAttributeLocation);

	// specify how the data is displayed in the buffer. 
 	// we bind the buffer to a location called ARRAY_BUFFER.
 	// It is the current buffer we are working on!.
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
	var size = 2;          // 2 components per iteration
	var type = gl.FLOAT;   // the data is 32bit floats
	var normalize = false; // don't normalize the data
	var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
	var offset = 0;        // start at the beginning of the buffer
	gl.vertexAttribPointer(
		positionAttributeLocation, size, type, normalize, stride, offset);


	var positions=trianglesFromRect(padding,padding,width-padding*2,height-padding*2);
	console.log(positions);

	// set buffer data.
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	
	// send the data to the server? or is this sending the pointer?
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

	//NOTE! now we are free to use ARRAY_BUFFER again, positionAttributeLocation is bound to the buffer.
	// Further note: DATA structure. We set size to 2. And in Vertex we set vec4. that
	// has a default (0,0,0,1), which means if we send 8,4 -> we get 8,4,0,1.

	// Create a texture.
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Set the parameters so we can render any size image.
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	// We can now execute.
	var primitiveType = gl.TRIANGLES; // the primative to draw.
	var offset = 0; // the offset within the buffer?
	var count = 6; // the number of times to pull data from the buffer.

	// making and getting the image

	// do frame buffer.
	var img=null;
	var maxCount=1000;
	var i=0;
	function doDraw(){
		// Upload the image into the texture.
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);		

		// draw the image.
		gl.drawArrays(primitiveType, offset, count);

		// log for drawing..
		console.log('drawn');

		i=i+1;
		if(i==maxCount)
			return;
		// each 10 ms.
		window.setTimeout(doDraw,10);
	}

	var imgsrc=
		'clown.jpg';
	$("<img />").attr('src',imgsrc).on('load',function(){
		img=this;

		console.log('image loaded.');
		doDraw();
	})

});