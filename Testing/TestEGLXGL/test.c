// core
// #include <stdio.h>
// #include <stdlib.h>
// #include <unistd.h>
// #include <cstring>
// #include <string>
// #include <fstream>
// #include <streambuf>

#include <assert.h>
#include <math.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <X11/Xlib.h>
#include <streambuf>
#include <fstream>
#include <unistd.h>

// XLib
#include <X11/Xlib.h>

// opengl
// #include <GL/glew.h>
// #include <GL/glut.h>
// #include <GLES/egl.h>
// #include <GLES/gl.h>
//#include <GL/glew.h>
//#include <GL/glut.h>
//#include <GLES2/egl.h>
//#include <GLES2/gl2ext.h>

#include <GLES2/gl2.h>
#include <EGL/egl.h>

//using namespace std;

///////////////////////////
// Variables
Display* display;
EGLDisplay eglDisplay;
Window wndRoot;
Window wndSource;
Window wndDest;
GLuint eglActiveProgram;

///////////////////////////
// X11 functions

void InitX11(char* displaySrc=NULL)
{
	display=XOpenDisplay(displaySrc);	
	printf("Opend display.\n");
	wndRoot=XRootWindow(display,0);
}

///////////////////////////
// EGL functions
void InitEGL(bool vebrose=true)
{
	eglDisplay=eglGetDisplay(display);
	EGLint minor,major;
	if(!eglInitialize(eglDisplay, &major, &minor))
	{
		printf("Error while initializing EGL\n");
		return;
	}
	
	if(vebrose)
	{
		// print info.
		const char* s = eglQueryString(eglDisplay, EGL_VERSION);
		printf("EGL_VERSION = %s\n", s);
		s = eglQueryString(eglDisplay, EGL_VENDOR);
		printf("EGL_VENDOR = %s\n", s);
		s = eglQueryString(eglDisplay, EGL_EXTENSIONS);
		printf("EGL_EXTENSIONS = %s\n", s);
		s = eglQueryString(eglDisplay, EGL_CLIENT_APIS);
		printf("EGL_CLIENT_APIS = %s\n", s);
		printf("Initialize EGL %d.%d\n",major,minor);	
	}
}

///////////////////////////
// Program functions

char* ExePath() {
	char buffer[1000];
	char *answer = getcwd(buffer, sizeof(buffer));
    return answer;
}

char* GetFileSource(char* src)
{
	char* searchPath=new char[1000];
	sprintf(searchPath,"%s/%s",ExePath(),src);
	//printf("Loading: %s\n", searchPath);
	std::ifstream f(searchPath);
	std::string contents((std::istreambuf_iterator<char>(f)), 
	    std::istreambuf_iterator<char>());

	//printf("%s\n",contents);
	char *cstr = new char[contents.length() + 1];
	strcpy(cstr,contents.c_str());
	return cstr;
}

// Create a shader object, load the shader source, and
// compile the shader.
GLuint CreateShader(char *sourceCode, GLenum type)
{
	printf("Compiling shader... ");
	
	// Create the shader object
	GLuint shader = glCreateShader(type);
	if(shader == 0)
	{
		printf("ERROR! cannot create shader\n");
		return 0;
	}

	// Load the shader source
	glShaderSource(shader, 1, &sourceCode, NULL);

	// Compile the shader
	glCompileShader(shader);

	GLint compiled;
	// Check the compile status
	glGetShaderiv(shader, GL_COMPILE_STATUS, &compiled);

	if(!compiled)
	{
		printf("ERROR! Cannot compile shader.\n");
		GLint infoLen = 0;
		glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &infoLen);

		if(infoLen > 1)
		{
			char* infoLog = new char[infoLen];
			glGetShaderInfoLog(shader, infoLen, NULL, infoLog);
			//esLogMessage("Error compiling shader:\n%s\n", infoLog);
			printf("%s\n", infoLog);
			free(infoLog);
		}
		else printf("No info found.\n");
		glDeleteShader(shader);
		return 0;
	}
	else printf("OK\n");

	return shader;
}

void CreateProgram()
{
	// creating the gl shaders.
	char* vertexSource=GetFileSource("simplevertex.glgc");
	char* fragmentSource=GetFileSource("simplefragment.glgc");
	GLuint fragmentShader=CreateShader(fragmentSource,GL_FRAGMENT_SHADER);
	GLuint vertexShader=CreateShader(vertexSource,GL_VERTEX_SHADER);

	// creating the program
	GLuint program = glCreateProgram();
	glAttachShader(program,vertexShader);
	glAttachShader(program,fragmentShader);

	glBindAttribLocation(program, 0, "a_position");

	// Link the program
	glLinkProgram(program);
	printf("Link command complete.\n");
	GLint linked=0;

	// Check the link status
	glGetProgramiv(program, GL_LINK_STATUS, &linked);
	if(!linked)
	{
		printf("Error while linking program.\n");
		GLint infoLen = 0;
		glGetProgramiv(program, GL_INFO_LOG_LENGTH, &infoLen);

		if(infoLen > 1)
		{
			char* infoLog = new char[infoLen];
			glGetProgramInfoLog(program, infoLen, NULL, infoLog);
			//esLogMessage("Error linking program:\n%s\n", infoLog);
			printf("%s\n", infoLog);
			free(infoLog);
		}
		else printf("No program info found.\n");
		glDeleteProgram(program);
		return;
	}

	eglActiveProgram=program;
}

///////////////////////////
// Main

// Main program entry point.
int main(int argv,char** argc)
{
	InitX11();
	InitEGL();
	CreateProgram();
	return 0;
}


// EGLConfig eglConfig;
// EGLContext eglContext;
// EGLSurface target;
// EGLSurface source;

// EGLint egl_num_config;
// static EGLint const egl_attribute_list[] = {
//         EGL_RED_SIZE, 1,
//         EGL_GREEN_SIZE, 1,
//         EGL_BLUE_SIZE, 1,
//         EGL_NONE
// };

// ///////////////////////////
// // helper operations

// char* ExePath() {
//     char* buffer=new char[1000];
//     getwd(buffer);
//     return buffer;
// }

// char* GetFileSource(char* src)
// {
// 	char* searchPath=new char[1000];
// 	sprintf(searchPath,"%s/%s",ExePath(),src);
// 	//printf("Loading: %s\n", searchPath);
// 	std::ifstream f(searchPath);
// 	std::string contents((std::istreambuf_iterator<char>(f)), 
// 	    std::istreambuf_iterator<char>());

// 	//printf("%s\n",contents);
// 	char *cstr = new char[contents.length() + 1];
// 	strcpy(cstr,contents.c_str());
// 	return cstr;
// }

// /////////////////////////////////////////////////////
// // Egl helpers

// // Create a shader object, load the shader source, and
// // compile the shader.
// GLuint CreateShader(char *shaderSrc, GLuint type)
// {
// 	printf("Compiling shader... ");
	
// 	// Create the shader object
// 	GLuint shader = glCreateShader(type);
// 	if(shader == 0)
// 		return 0;

// 	// Load the shader source
// 	glShaderSource(shader, 1, &shaderSrc, NULL);
// 	// Compile the shader
// 	glCompileShader(shader);

// 	GLint compiled;
// 	// Check the compile status
// 	glGetShaderiv(shader, GL_COMPILE_STATUS, &compiled);

// 	if(!compiled)
// 	{
// 		printf("ERROR!\n");
// 		GLint infoLen = 0;
// 		glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &infoLen);

// 		if(infoLen > 1)
// 		{
// 			char* infoLog = new char[infoLen];
// 			glGetShaderInfoLog(shader, infoLen, NULL, infoLog);
// 			//esLogMessage("Error compiling shader:\n%s\n", infoLog);
// 			printf("%s\n", infoLog);
// 			free(infoLog);
// 		}
// 		else printf("No info found.\n");
// 		glDeleteShader(shader);
// 		printf("Cannot create shader.\n");
// 		return 0;
// 	}
// 	else printf("OK\n");
// 	return shader;
// }

// XEvent WaitForXEvent()
// {
// 	XEvent ev;
// 	XNextEvent(display,&ev);
// 	return ev;
// }

// void ValidateGlewInit()
// {
// 	// GLenum err = glewInit();
// 	// if (err != GLEW_OK)
// 	// {
// 	// 	printf("Errot initializing glew:\n");
// 	// 	printf("%s\n", glewGetErrorString(err));
// 	//   	exit(1); // or handle the error in a nicer way
// 	// }
// }

// void ClearGLWindow()
// {
// 	glClearColor(1.0, 1.0, 0.0, 1.0);
// 	glClear(GL_COLOR_BUFFER_BIT);
// 	glFlush();
//     eglSwapBuffers(display, target);
// }


	//eglChooseConfig(eglDisplay, egl_attribute_list, &eglConfig, 1, &egl_num_config);
	

	// // Creating context and windows.
	// eglContext = eglCreateContext(eglDisplay, eglConfig, EGL_NO_CONTEXT, NULL);
	// EGLContext current=eglGetCurrentContext();
	// printf("EGL context is %s\n", current==NULL?"BAD":"OK");
	// Window wid = XCreateWindow(display,root,0,0,400,400,0,depth,InputOutput,NULL,0,NULL);
	// XMapWindow(display,wid);
	// unsigned long sourceId=0x1e00003; 
 //    printf("Window binding complete: %lu %lu\n", wid,sourceId);
	// source=eglCreateWindowSurface(eglDisplay,eglConfig,sourceId, NULL);
	// target=eglCreateWindowSurface(eglDisplay,eglConfig,wid,NULL);

	// eglMakeCurrent(eglDisplay,target,target,eglContext);
	// //glViewport(0,0,200,200);
	// //ClearGLWindow();
	// printf("Prepare surface complete\n"); 
	// //printf("Vertex Source:\n%s\n",vertexSource);
	// //printf("Fragment Source:\n%s\n",fragmentSource);

	// // creating the gl program.
	// char* vertexSource=GetFileSource("simplevertex.glgc");
	// char* fragmentSource=GetFileSource("simplefragment.glgc");
	// GLuint fragmentShader=CreateShader(fragmentSource,GL_FRAGMENT_SHADER);
	// GLuint vertexShader=CreateShader(vertexSource,GL_VERTEX_SHADER);

	// printf("Shaders compilation complete.\n");

	// // creating the program.
	// GLuint program = glCreateProgram();
	// glAttachShader(program,vertexShader);
	// glAttachShader(program,fragmentShader);

	// glBindAttribLocation(program, 0, "a_position");

	// // Link the program
	// glLinkProgram(program);
	// printf("Link command complete.\n");
	// GLint linked=0;

	// // Check the link status
	// glGetProgramiv(program, GL_LINK_STATUS, &linked);
	// if(!linked)
	// {
	// 	printf("Error while linking program.\n");
	// 	GLint infoLen = 0;
	// 	glGetProgramiv(program, GL_INFO_LOG_LENGTH, &infoLen);

	// 	if(infoLen > 1)
	// 	{
	// 		char* infoLog = new char[infoLen];
	// 		glGetProgramInfoLog(program, infoLen, NULL, infoLog);
	// 		//esLogMessage("Error linking program:\n%s\n", infoLog);
	// 		printf("%s\n", infoLog);
	// 		free(infoLog);
	// 	}
	// 	else printf("No program info found.\n");
	// 	glDeleteProgram(program);
	// 	return -1;
	// }

	// GLint position_buffer=glGetAttribLocation(program,"a_position");
	// glUseProgram(program);
	// printf("GL program linked, position buffer location: %d",position_buffer);

	// GLfloat vVertices[] = {0.0f, 0.5f, 0.0f,
	// 					-0.5f, -0.5f, 0.0f,
	// 					0.5f, -0.5f, 0.0f};

	// eglMakeCurrent(eglDisplay,target,target,eglContext);

	// fflush(stdout);
	// WaitForXEvent();
	// sleep(3);
	// printf("OK\n");
	// XCloseDisplay(display);
