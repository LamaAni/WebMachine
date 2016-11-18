// returns the source code.
var fs=require('fs');
var isNode=new Function("try {return this===global;}catch(e){return false;}");
module.exports={
	extend:function(gl){
		gl.CompileShader=function(type, source) {
			// creates the shader.
			var shader = this.createShader(type);
			// sets the shader source code.
			this.shaderSource(shader, source);
			// compiles the shader.
			this.compileShader(shader);

			// check if shader is ok.
			var success = this.getShaderParameter(shader, this.COMPILE_STATUS);
			if (success) {
				return shader;
			}
			// shader errors/could no be compiled.
			console.error('Cannot ceate shander,\n', this.getShaderInfoLog(shader));
			this.deleteShader(shader);
		};
		gl.CompileVertexShader=function(source)
		{
			return this.CompileShader(this.VERTEX_SHADER,source);
		};
		gl.CompileFragmentShader=function(source)
		{
			return this.CompileShader(this.FRAGMENT_SHADER,source);
		};
		gl.CompileWebGLProgram=function(vertexShader, fragmentShader) {
			// creating the program.
			var program = this.createProgram();

			// attaching the shaders
			this.attachShader(program, vertexShader);
			this.attachShader(program, fragmentShader);

			// linking the program.
			this.linkProgram(program);
			var success = this.getProgramParameter(program, this.LINK_STATUS);
			if (success) {
				// all ok.
				return program;
			}

			console.error('Cannot create WebGL program:\n',this.getProgramInfoLog(program));
			this.deleteProgram(program);
		};
		gl.CompileWebGLProgramFromSource=function(vertexSource,fragmentSource)
		{
			return this.CompileWebGLProgram(
				this.CompileVertexShader(vertexSource),
				this.CompileFragmentShader(fragmentSource))
		};
		gl.GeometryHelpers={
			TrianglesFromRect:function(x,y,width,height)
			{
				var trig=new Float32Array([
					x,y, // top left
					x+width,y, // top right
					x,y+height, // bottom left
					x,y+height, // bottom left
					x+width,y, // top right
					x+width,y+height // bottom right
				]);
				console.log('for ',x,y,width,height,'we get',trig);
				return trig;
			}
		};
		return gl;
	},
	extendPrototype:function(){
		if(this.ExtendedPrototype==true)
			return;
		this.ExtendedPrototype=true;
		WebGLRenderingContext.prototype=this.extend(WebGLRenderingContext.prototype);
		console.log('Extended WebGLRenderingContext prototype.');
	}
}
// if(typeof(WebGLRenderingContext)!=='undefined' && WebGLRenderingContext.prototype.___extendedForWebGLHelpers==true)
// {

// 	var isNode=new Function("try {return this===global;}catch(e){return false;}");

// 	// webgl context exists.
// 	var extendO={
		
// 	};

// 	// extending the webgl object.
// }
// function getSource(url) {
//     var source="";
// 	$.ajax({
// 	    url: url,
// 	    success: function(data){
// 	    	source=data;
// 	    },
// 	    async:false
// 	});
// 	return source;
// }

// // // creates a shader from source code.
// // // gl - context, type - type of shader, source - code for shader.
// // function createShader(gl, type, source) {
// // 	// creates the shader.
// // 	var shader = gl.createShader(type);
// // 	// sets the shader source code.
// // 	gl.shaderSource(shader, source);
// // 	// compiles the shader.
// // 	gl.compileShader(shader);

// // 	// check if shader is ok.
// // 	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
// // 	if (success) {
// // 		return shader;
// // 	}
// // 	// shader errors/could no be compiled.
// // 	console.error('Cannot ceate shander,\n', gl.getShaderInfoLog(shader));
// // 	gl.deleteShader(shader);
// // }
