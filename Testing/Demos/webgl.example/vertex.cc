// Position for the current point in the rectangle.
attribute vec2 a_position;

// the resolution.
uniform vec2 u_resolution;

// varying (interpulated position by webgl), which pixel color to draw.
varying vec2 v_texCoord;
 
// all shaders have a main function
// this is the main function for the shader.
void main() {
	// convert the positon from pixels to image position.
	vec2 asInColorSpace=(a_position / u_resolution);

    // convert the position from pixels to -1.0 to 1.0
    vec2 asInClipSpace = (a_position / u_resolution)*2.0-1.0;
 	
 	// convert to the corrent coordinates.
 	asInClipSpace = asInClipSpace*vec2(1,-1);

 	// set the geomtry position. (this is a 4vec)
    gl_Position = vec4(asInClipSpace, 0, 1);
	
	// pass the texCoord to the fragment shader
	// The GPU will interpolate this value between points
	v_texCoord = asInColorSpace;
}