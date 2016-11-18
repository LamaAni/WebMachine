// Since we are dealing with BYTE data there is no need for more then medium precison.
// mediump - image positions.
// lowp - colors.
// mediump - positions.
// highp - vertex coordinates. (usually not needed);
precision mediump float;

// the texture image.
uniform sampler2D u_image;

// the texCoords passed in from the vertex shader.
varying vec2 v_imageCoordinates;

void main() {
	// gl_FragColor is a special variable a fragment shader (sets the color)
	// Look up a color from the texture.
	gl_FragColor = texture2D(u_image, v_imageCoordinates).bgra;
}