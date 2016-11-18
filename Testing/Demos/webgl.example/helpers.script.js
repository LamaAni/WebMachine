// returns the source code.
function getSource(url) {
    var source="";
	$.ajax({
	    url: url,
	    success: function(data){
	    	source=data;
	    },
	    async:false
	});
	return source;
}

// creates a shader from source code.
// gl - context, type - type of shader, source - code for shader.
function createShader(gl, type, source) {
	// creates the shader.
	var shader = gl.createShader(type);
	// sets the shader source code.
	gl.shaderSource(shader, source);
	// compiles the shader.
	gl.compileShader(shader);

	// check if shader is ok.
	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}
	// shader errors/could no be compiled.
	console.error('Cannot render shander,\n', gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
}

function createVertexShader(gl,source)
{
	return createShader(gl,gl.VERTEX_SHADER,source);
}

function createFragmentShader(gl,source)
{
	return createShader(gl,gl.FRAGMENT_SHADER,source);
}

function createWebGLProgram(gl, vertexShader, fragmentShader) {
	// creating the program.
	var program = gl.createProgram();

	// attaching the shaders
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);

	// linking the program.
	gl.linkProgram(program);
	var success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		// all ok.
		return program;
	}

	console.error('Cannot create WebGL program:\n',gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}

function createWebGLProgramFromSource(gl,vertexSource,fragmentSource)
{
	return createWebGLProgram(gl,
		createVertexShader(gl,vertexSource),
		createFragmentShader(gl,fragmentSource))
}

function trianglesFromRect(x,y,width,height)
{
	return new Float32Array([
		x,y,
		x+width,y,
		x,y+height,
		x,y+height,
		x+width,y,
		x+width,y+height
	]);
}