// Core bindings
#include <cstdlib>
#include <unistd.h>
#include <cstring>
#include <vector>
#include <string>
#include <fstream>
#include <streambuf>

// Node bindings
#include <node.h>
#define NODEARGS const FunctionCallbackInfo<Value>& args
#define ISOLATE Isolate* isolate = args.GetIsolate();
#define INITRPRS int __cpr=-1;
#define JSFUNCINIT ISOLATE; INITRPRS;
#define NEXTPARAM __cpr++;
#define CURPARAM args[i__cpr]
#define GETNEXTPARAM GetNextParameter(args,&__cpr)

// XLib
#include <X11/X.h>
#include <X11/Xlib.h>

// opengl
#include <GLES2/gl2.h>
#include <EGL/egl.h>

namespace TestGLX
{

using v8::FunctionCallbackInfo;
using v8::Function;
using v8::Isolate;
using v8::Local;
using v8::MaybeLocal;
using v8::Object;
using v8::Uint8Array;
using v8::Uint8ClampedArray;
using v8::Value;
using v8::Integer;
using v8::Number;
using v8::String;
using v8::Boolean;
using v8::Exception;
using v8::ArrayBuffer;
using v8::ArrayBufferView;
using v8::DataView;

using namespace node;
	///////////////////////////
	// Variables
	Display* display;

	EGLDisplay eglDisplay;
    EGLConfig eglConfig;
    EGLContext eglContext;
    EGLSurface target;
    EGLSurface source;

    EGLint egl_num_config;
	static EGLint const egl_attribute_list[] = {
	        EGL_RED_SIZE, 1,
	        EGL_GREEN_SIZE, 1,
	        EGL_BLUE_SIZE, 1,
	        EGL_ALPHA_SIZE, 1,
	};

	///////////////////////////
	// helper operations
	const char* GetFileSource(char* src)
	{
		std::ifstream t(src);
		std::string str;

		t.seekg(0, std::ios::end);   
		str.reserve(t.tellg());
		t.seekg(0, std::ios::beg);

		str.assign((std::istreambuf_iterator<char>(t)),
		            std::istreambuf_iterator<char>());

		return str.c_str();
	}

	Local<Value> GetNextParameter(const FunctionCallbackInfo<Value>& args, int* idx)
	{
		int curv=*idx;
		curv++;
		*idx=curv;
		return args[curv];
	}

	/////////////////////////////////////////////////////
	// Egl helpers

	// Create a shader object, load the shader source, and
	// compile the shader.
	GLuint CreateShader(const char *shaderSrc, GLenum type)
	{
		GLuint shader;
		GLint compiled;

		// Create the shader object
		shader = glCreateShader(type);
		if(shader == 0)
			return 0;

		// Load the shader source
		glShaderSource(shader, 1, &shaderSrc, NULL);

		// Compile the shader
		glCompileShader(shader);
		// Check the compile status
		glGetShaderiv(shader, GL_COMPILE_STATUS, &compiled);

		if(!compiled)
		{
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
			glDeleteShader(shader);
			printf("Cannot create shader.\n");
			return 0;
		}
		return shader;
	}

	/////////////////////////////////////////////////////
	// Initialization values.

	// arguments: displayNumber, screenNumber, drawWindow
	void Initialize(NODEARGS)
	{
		JSFUNCINIT;
		//printf("%d\n", __cpr);
		int displayNum=(int)GETNEXTPARAM->ToInteger()->Value(); //printf("%d\n", __cpr);
		int screenNum=(int)GETNEXTPARAM->ToInteger()->Value();//printf("%d\n", __cpr);
		int wid=(int)GETNEXTPARAM->ToInteger()->Value();//printf("%d\n", __cpr);
		int sourceId=(int)GETNEXTPARAM->ToInteger()->Value(); // the id of the window to load from. 
	    printf("%d %d %d\n", displayNum,screenNum,wid);

		// opening display;
		char* disp_string=new char[200];
		sprintf(disp_string, ":%d.%d",displayNum,screenNum);

		display=XOpenDisplay(disp_string);
		printf("Opend display at %s\n",disp_string);

		// initializing egl
		eglDisplay=eglGetDisplay(display);

		eglInitialize(eglDisplay, NULL, NULL);
		eglChooseConfig(eglDisplay, egl_attribute_list, &eglConfig, 1, &egl_num_config);
		eglContext = eglCreateContext(eglDisplay, eglConfig, EGL_NO_CONTEXT, NULL);
		
		// copy attempt.
		eglMakeCurrent(eglDisplay,NULL,NULL,eglContext);
		printf("Initialize EGL\n");

		// check to see if we can load the glx context.
		// GLXContext glxConext=glXGetCurrentContext();
		// printf("GLX context is %s\n", glxConext==NULL?"BAD":"OK");

		EGLContext current=eglGetCurrentContext();
		printf("EGL context is %s\n", current==NULL?"BAD":"OK");

		source=eglCreateWindowSurface(eglDisplay, eglConfig, sourceId, NULL);
		target=eglCreateWindowSurface(eglDisplay,eglConfig,wid,NULL);
		printf("Surface creation complete.\n");

		eglMakeCurrent(eglDisplay,target,source,eglContext);

		// clearing the background
		glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
		glClear(GL_COLOR_BUFFER_BIT);

		// creating the gl program.
		GLuint fragmentShader=CreateShader(GetFileSource("simplefragment.cc"),GL_FRAGMENT_SHADER);
		GLuint vertexShader=CreateShader(GetFileSource("simplevertex.cc"),GL_VERTEX_SHADER);

		printf("Shaders compilation complete.\n");

		// creating the program.
		GLuint program = glCreateProgram();
		glAttachShader(program,vertexShader);
		glAttachShader(program,fragmentShader);

		// creating the position.
		glBindAttribLocation(program,0,"a_position");

		// Link the program
		glLinkProgram(program);

		GLint linked;

		// Check the link status
		glGetProgramiv(program, GL_LINK_STATUS, &linked);
		if(!linked)
		{
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
			glDeleteProgram(program);
			printf("Error while linking program.\n");
			return;
		}
		printf("GL program linked\n");
	}

	/////////////////////////////////////////////////////
	// Triangle example


	/////////////////////////////////////////////////////
	// Building the module.

	// Validation of the module action.
	void Validate(NODEARGS)
	{
		ISOLATE;
		printf("TestGLX module is OK.\n");
	}

	// Do cleanip here.
	void exiting()
	{
	}

	// called to create the module functions. 
	void WDCppExtentions_init(Local<Object> exports) {
		
		// call for multiple threads in xorg.
		// since this is a node app, there may be multiple threads.
		XInitThreads();

		std::atexit(exiting);

		NODE_SET_METHOD(exports, "Validate", Validate);
		NODE_SET_METHOD(exports, "Initialize", Initialize);

		// method add example.
		// NODE_SET_METHOD(exports, "[method name to show in js]", [method name in C]);



	  	// NODE_SET_METHOD(exports, "PixmapToImageData", DoPixmapToImageDataCopy);
	  	// NODE_SET_METHOD(exports, "CopyImageFromX", DoCopyImageFromX);
	  	// NODE_SET_METHOD(exports, "ConnectToDisplay", DoConnectToDisplay);
	  	// NODE_SET_METHOD(exports, "GetSHMExtentionInfo", DoGetSHMExtentionInfo);
	  	// NODE_SET_METHOD(exports, "PrepareSHMImage",DoPrepareSHMImage);
	  	// NODE_SET_METHOD(exports, "CopySHMImageFromX",DoCopySHMImageFromX);
	  	// NODE_SET_METHOD(exports, "CopyShmImageToDataBuffer",DoCopyShmImageToDataBuffer);
	  	// NODE_SET_METHOD(exports, "CopyShmImageToTexture",DoCopyShmImageToTexture);
	  	// NODE_SET_METHOD(exports,"CheckCurrentGLContext",DoCheckCurrentGLContext);

	}

	NODE_MODULE(addon, WDCppExtentions_init)
	
}  // namespace demo