// making sure we extend the prototype.
var helperExtend=require(__dirname+'/webgl.helpers.js');
var sourcepath=__dirname;
// construct a compositior from the gl context.
var compositor=function(gl,vertexSource=null,fragmentSource=null)
{
	if(gl==null || gl.texImage2D == null)
	{
		console.error('Cannot create a compositor from a non webGL context.');
		return;
	}

	// loading core sources if needed.
	vertexSource = vertexSource===null ? this.ReadCompositorSource(true) : vertexSource;
	fragmentSource= fragmentSource===null ? this.ReadCompositorSource(false) : fragmentSource;
	
	console.log('Initalizing compositor...', {
		"Vertex Source":vertexSource,
		"Fragement Source":fragmentSource});

	gl=helperExtend.extend(gl);

	// binding hte webgl context.
	this.BindToWebGLContext(gl);

	// params.
	this.Program=null; // the gl program currently active.
	this.VertexSource=null;
	this.FragmentSource=null;
	this.Initialized=false;

	// program error.
	var vOK=vertexSource!==null;
	var fOK=fragmentSource!==null;
	if( vOK && fOK)
	{

		this.Initialize(vertexSource,fragmentSource);
		return;
	}
	else if(vOK!=fOK)
	{
		console.warn('Sent '+ (vOK ? "vertexSource" : "fragmentSource")+
			" but not "+ (fOK ? "vertexSource" : "fragmentSource")+
			", gl program was not created.");
	}
	
	console.warn('Compositor created but not initialized.');
}
var fs=require('fs');
compositor.prototype={
	CompositorVertexSourceFile:'Compositor.Vertex.cc',
	CompositorFragmentSourceFile:'Compositor.Fragment.cc',
	ReadCompositorSource:function(isVertex){
		var path=sourcepath+"/"+
			(isVertex? this.CompositorVertexSourceFile : this.CompositorFragmentSourceFile);
		this.lastLoadedPath=path;
		if(fs.existsSync(path))
		{
			return fs.readFileSync(path,encoding='utf8');
		}
		else return null;
	},
	BindToWebGLContext:function(gl){
		this.gl=gl;
	},
	TestLog:function(txt)
	{
		global.window.console.log(txt);
	},
	Initialize:function(vertexSource,fragmentSource)
	{
		if(this.Initialized)
		{
			console.warn('Attempt to reinitialize an initialized compositor.');
			return;
		}
		this.Initialized=true;
		var gl=this.gl;

		// creates the program fpr this gl context.
		this.Program=gl.CompileWebGLProgramFromSource(vertexSource,fragmentSource);
		this.gl.useProgram(this.Program);
		this.VertexSource=vertexSource;
		this.FragmentSource=fragmentSource;

		// attributes can be fed by buffers and are changeable.
		this.PositionAttributeLocation = gl.getAttribLocation(this.Program, "a_position");

		// uniforms are constants.
		this.ResolutionUniformLocation = gl.getUniformLocation(this.Program, "u_resolution");

		// Create the buffer to feed the attribute.
		this.PositionBuffer=gl.createBuffer();

		// Set the core rendering positions, we are always rendering a square
		this.PrimitiveType = gl.TRIANGLES; // 2 triangles make a square. 
		this.PositionDrawCount=6; // the count to draw.
		this.PositionDataOffset=0; // the offset for the data for the position.

		// creating the texsture.
		this.Texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.Texture);
		this.TextureID = gl.getParameter(gl.ACTIVE_TEXTURE);

		// setting the basic parameters for webgl image.
		// Set the parameters so we can render any size image.
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

		// set the current active budder and attach that to the appropriate location.
		gl.bindBuffer(gl.ARRAY_BUFFER, this.PositionBuffer);

		// Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
		var size = 2;          // 2 components per iteration
		var type = gl.FLOAT;   // the data is 32bit floats
		var normalize = false; // don't normalize the data
		var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
		var offset = 0;        // start at the beginning of the buffer
		gl.vertexAttribPointer(
			this.PositionAttributeLocation, size, type, normalize, stride, offset);

		// enable the attribute we set, possitionAttributeLocation, to apply to vertex.
		gl.enableVertexAttribArray(this.PositionAttributeLocation);

		console.log('Compositor created and initialized',this);
	},
	Clear:function()
	{
		var gl=this.gl;
		gl.clearColor(0, 0, 0, 0); // set the color to black transparent.
		gl.clear(gl.COLOR_BUFFER_BIT); // call to claer.
	},
	SetViewport:function(x,y,width,height){
		var gl=this.gl;

		// setting the resolution.
		gl.uniform2f(this.ResolutionUniformLocation, width, height);
		// create the viewport.
		gl.viewport(x,y,width,height);
		// clear since we changed viewport.
		this.Clear();

		// sets the current draw rect.
		this.SetDrawRect(0,0,width,height);

		// initialization the draw aread.
		this.DrawInitializationRect(width,height,new Uint8Array(width*height*4));
	},
	CreateRenderRegions:function(x,y,width,height)
	{
		// creates multiple render regions so the glx would not have to update
		// the entire canvas when updating regions. The size of the render regions 
		// are default to 200x200 pix. 
	},
	SetDrawRect:function(x,y,width,height){
		var gl=this.gl;

		// creating the triangles positions.
		var positions=gl.GeometryHelpers.TrianglesFromRect(x,y,width,height);

		// Set the current buffer,
		//gl.bindBuffer(gl.ARRAY_BUFFER, this.PositionBuffer);

		// load the data into the buffer.
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	},
	DrawInitializationRect:function(width,height,data)
	{
		// called to draw the initializaition of the viewport
		var gl=this.gl;

		if(data!=null)
		{
			// loading the image data into the server.
			gl.texImage2D(
				gl.TEXTURE_2D, // target
				0, // level
				gl.RGBA, // internalformat
				width, height,  // width, height
				0, // border
				gl.RGBA, // format
				gl.UNSIGNED_BYTE, // type
				data); // the data to draw
		}

		// drawing the image.
		gl.drawArrays(this.PrimitiveType, this.PositionDataOffset, this.PositionDrawCount);
	},
	// DrawOnRect:function(width,height,data){
	// 	var gl=;

	// 	// loading the image data.
	// 	


	// 	//// drawing the image.
	// 	//gl.drawArrays(this.PrimitiveType, this.PositionDataOffset, this.PositionDrawCount);
	// },
	DrawImage:function(x,y,width,height,data)
	{
		// setting the new draw rect?
		this.SetDrawRect(x,y,width,height);

		var gl=this.gl;

		if(data!=null)
		{
			// updating the texture.
			// target, level, xoffset, yoffset, width, height, format, type, ArrayBufferView? pixels
			gl.texSubImage2D(
				gl.TEXTURE_2D, // target
				0, // level
				x, y, // xoffset, yoffset
				width, height,  // width, height
				gl.RGBA, // format
				gl.UNSIGNED_BYTE, // type
				data); // the data to draw
		}
		
		gl.drawArrays(this.PrimitiveType, this.PositionDataOffset, this.PositionDrawCount);
	}
};
module.exports=compositor;