// fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision"
precision mediump float;

// the texture image.
uniform sampler2D u_image;

// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

void main() {
	// gl_FragColor is a special variable a fragment shader (sets the color)
	// Look up a color from the texture.
	gl_FragColor = texture2D(u_image, v_texCoord);
}