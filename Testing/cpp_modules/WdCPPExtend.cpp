#include <node.h>
//#include <node_buffer.h>

#include <sys/ipc.h>
#include <sys/shm.h>

#include <X11/Xlib.h>
#include <X11/Xutil.h>
#include <X11/extensions/XShm.h>

#include <cstdlib>
#include <unistd.h>
#include <cstring>
#include <vector>

// opengl
#include <GL/gl.h>
#include <GL/glu.h>
#include <GL/glut.h>

// gl for the x system
#include <GL/glx.h>

// egl (Webgl - Kronos)
#include <EGL/egl.h>
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
// opengl bindings $(pkg-config --libs gl)

// SDL
#include <SDL/SDL.h>

namespace WDCppExtentions {

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

////////////////////////////////////
/// X11 core.
// Nodejs Arguments : display,screen
Display* display;
GLXContext glxContext;
void DoConnectToDisplay(const FunctionCallbackInfo<Value>& args)
{
	// GL
	Isolate* isolate = args.GetIsolate();
	int p=0;
	int dispN=args[p]->ToInteger()->Value();p++;
	int screenN=args[p]->ToInteger()->Value();p++;
	char* displayLink = new char[200];
	sprintf(displayLink,":%d.%d",dispN,screenN);
	display=XOpenDisplay(displayLink);

	args.GetReturnValue().Set(String::NewFromUtf8(isolate,displayLink));
	delete []displayLink;

	// EGLint major, minor;
	// eglBindAPI (EGL_OPENGL_ES_API);
	// eglInitialize(eglGetDisplay(display),&major,&minor);
	// printf("Connected to egl display %d.%d\n",major,minor);

	// static int attributeList[] = { GLX_RGBA, GLX_DOUBLEBUFFER, GLX_RED_SIZE, 1, GLX_GREEN_SIZE, 1, GLX_BLUE_SIZE, 1, None };
	// XVisualInfo *vi = glXChooseVisual(display, DefaultScreen(display),attributeList);
 
	// glxContext=glXCreateContext(display,vi,0,true);
	// glXMakeCurrent(display,DefaultRootWindow(display),glxContext);
	SDL_Surface* screen;
	if(SDL_Init(SDL_INIT_VIDEO | SDL_INIT_AUDIO | SDL_INIT_TIMER)!=0)
	{
		screen = SDL_SetVideoMode(300, 300, 0, SDL_OPENGL);
		if (screen == NULL)
		{
			printf("Could not set video mode: %s, \n", SDL_GetError());
		}
	}
	else printf("Error while initializing SDL.\n");
}

void DoCheckCurrentGLContext(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = args.GetIsolate();

	GLXContext current=glXGetCurrentContext();
	if(current==NULL)
	{
		printf("No context found.\n");
	}
	else printf("Context ID: %d\n",current);

	if(args.Length() >0 )
	{
		// attepth egl.
		GLuint  tex=(GLuint)args[0]->ToInteger()->Value();

		printf("Sent texture is: %s\n",glIsTexture(tex)?"OK" : "Not FOund");
	}
}

//////////////////////////////////
/// Other functions

int64_t doPixelCopy(char* source, char* dest, 
	int64_t rowsize, int64_t xoffset, int64_t yoffset, int64_t width, int64_t height, bool hasAlpha)
{
	//int64_t byteRowSize=rowsize*4;
	int32_t pixelsCopied=0;
	int64_t i=0;int64_t si=0;int64_t sypos=0; int64_t dypos=0;
	int64_t x=0;int64_t y=0;
	// copy.
	for(y=0;y<height;y++)
	{
		// position to start copying.
		dypos=(yoffset+y)*rowsize; // position in the destination (which is a large image).
		sypos=y*width; // position in the source (which is a smaller image).

		for(x=0;x<width;x++)
		{
			// location.
			i=(dypos+xoffset+x)*4;
			si=(sypos+x)*4;

			dest[i]=source[si+2];
			dest[i+1]=source[si+1];
			dest[i+2]=source[si];
			if(hasAlpha)
			{
				dest[i+3]=source[si+3];
			}
			else dest[i+3]=255;
			
			//dest[i+3]=hasAlpha ? source[i+3] : 255;
			pixelsCopied++;
		}
	}

	return pixelsCopied;
}

///////////////////////////////////////////////////////////////
// Direct copy allowed from Node.Js
// Nodejs Arguments : source,dest,rowsize,xoffset,yoffset,width,height,hasAlpha
void DoPixmapToImageDataCopy(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = args.GetIsolate();
	// defining arrays.
	int p=0;

	Local<Uint8Array> sourceArray=Local<Uint8Array>::Cast(args[p]);p++;
	Local<Uint8ClampedArray> destArray=Local<Uint8ClampedArray>::Cast(args[p]);p++;

	int64_t rowsize=Local<Integer>::Cast(args[p])->Value();p++;
	int64_t xoffset=Local<Integer>::Cast(args[p])->Value();p++;
	int64_t yoffset=Local<Integer>::Cast(args[p])->Value();p++;
	int64_t width=Local<Integer>::Cast(args[p])->Value();p++;
	int64_t height=Local<Integer>::Cast(args[p])->Value();p++;
	bool hasAlpha=args[p]->ToBoolean()->Value();p++;

	// getting the data structure.
	char* source= (char*)sourceArray->Buffer()->GetContents().Data();
	char* dest= (char*)destArray->Buffer()->GetContents().Data();

	// the number of pixels to copy.
	//int64_t byteRowSize=rowsize*4;
	int32_t pixelsCopied=doPixelCopy(source,dest,rowsize,xoffset,yoffset,width,height,hasAlpha);

	args.GetReturnValue().Set(Integer::New(isolate,pixelsCopied));
}

////////////////////////////////////////////
// Returns an ximage ready for the display inside a canvas. 

// Nodejs Arguments : did,dest,dest_rowsize,xoffset,yoffset,width,height
// Return values: UInt8ClampedArray -> image data.
void DoCopyImageFromX(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = args.GetIsolate();
	// defining arrays.
	int p=0;
	Drawable did=(Drawable)Local<Integer>::Cast(args[p])->Value();p++;
	Local<Uint8ClampedArray> destArray=Local<Uint8ClampedArray>::Cast(args[p]);p++;

	int64_t rowsize=Local<Integer>::Cast(args[p])->Value();p++;
	int64_t xoffset=Local<Integer>::Cast(args[p])->Value();p++;
	int64_t yoffset=Local<Integer>::Cast(args[p])->Value();p++;
	int64_t width=Local<Integer>::Cast(args[p])->Value();p++;
	int64_t height=Local<Integer>::Cast(args[p])->Value();p++;

	XImage* img=XGetImage(display,did,xoffset,yoffset,width,height,0xffffffff,ZPixmap);
	char* dest= (char*)destArray->Buffer()->GetContents().Data();

	// the number of pixels to copy.
	//int64_t byteRowSize=rowsize*4;
	int32_t pixelsCopied=doPixelCopy(img->data,dest,rowsize,xoffset,yoffset,width,height,
		img->depth>24);

	args.GetReturnValue().Set(Integer::New(isolate,pixelsCopied));

	delete[] img;
//	delete[] rowsize,xoffset,width,height,
}

////////////////////////////////////
// Node using shm

// Validate that we can use the SHM extention.
void DoGetSHMExtentionInfo(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = args.GetIsolate();

	bool isValid=false;
	int ignore=0, major=0, minor=0;
  	int pixmaps=false;
  	
/* Check for the XShm extension */
  	if( XQueryExtension(display, "MIT-SHM", &ignore, &ignore, &ignore) ) {
    	if(XShmQueryVersion(display, &major, &minor, &pixmaps) == True) {
    		isValid=true;
    	      //sprintf(shmstr, "XShm extention version %d.%d %s shared pixmaps\n",
        //     major, minor, (pixmaps==True) ? "with" : "without");
    	}
    }

    // getting the version information.
    Local<Object> rt = Object::New(isolate);
    rt->Set(String::NewFromUtf8(isolate,"HasExtention"),Boolean::New(isolate,isValid));
    rt->Set(String::NewFromUtf8(isolate,"VersionMajor"),Integer::New(isolate,major));
    rt->Set(String::NewFromUtf8(isolate,"VersionMinor"),Integer::New(isolate,minor));
    rt->Set(String::NewFromUtf8(isolate,"HasPixmaps"),Boolean::New(isolate,pixmaps==1));

    args.GetReturnValue().Set(rt);
}

XShmSegmentInfo shm_info;
XImage* shm_image;
char* shm_data=NULL;
char* shm_copybuffer=NULL;


std::vector<XShmSegmentInfo>* shm_allocatedSharedMemoryInfo=
	new std::vector<XShmSegmentInfo>();;

// return the shared memory index.
int CreateSharedMemory(size_t memsize)
{
	XShmSegmentInfo info;

	// assigning shared memory. IPC_PRIVATE - means new (name bug)
	info.shmid = shmget(IPC_PRIVATE, memsize, IPC_CREAT | 0666 );

	printf("Shm memory created at id: %d, %lu bytes\n", info.shmid, memsize);

	if(info.shmid < 0)
	{
		return -1;
	}

	// Attaching the memory.
	info.shmaddr = (char*)shmat(info.shmid, 0, 0);

	// Assinging as not read onlu.
	info.readOnly = False;

	// the shared memory info.
	int index=shm_allocatedSharedMemoryInfo->size();
	shm_allocatedSharedMemoryInfo->push_back(info);

	return index;
}


void CleanSharedMemory(XShmSegmentInfo info)
{
	shmdt (shm_info.shmaddr);
	printf("Delete shared memory\n");
	shmctl (shm_info.shmid, IPC_RMID, 0);
	printf("Delete shared memory, id:%d\n",shm_info.shmid);
}

void CleanSharedMemory()
{
	// clean all shared memory allocated.
	for(size_t i=0;i<shm_allocatedSharedMemoryInfo->size();i++)
		CleanSharedMemory(shm_allocatedSharedMemoryInfo->at(i));
	shm_allocatedSharedMemoryInfo->clear();
}


void freeSharedImage()
{
	if(shm_data==NULL)
		return;

	XShmDetach (display, &shm_info);
	printf("Detach shared memory.\n");
	XDestroyImage(shm_image);
	printf("Destroy x server image.\n");
	
	//delete[] shm_data;
	shm_data=NULL;
	shm_copybuffer=NULL;
	printf("Cleared buffer pointers.\n");
	//delete[] &shm_info;
}

GLenum gl_sharetexture_id=-1;
bool opengl_initialized=false;
void InitOpenGLDirect(GLenum tex)
{
	gl_sharetexture_id=tex;
	glActiveTexture(GL_TEXTURE_2D);
	glBindTexture(GL_TEXTURE_2D, tex);
	opengl_initialized=true;
}

// prepares the SHM pixmap for copy operations,
// js args: wid, width, height, depth
void DoPrepareSHMImage(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = args.GetIsolate();

	// free if exists.
	if(shm_data!=NULL)
	{
		freeSharedImage();
		CleanSharedMemory(shm_info);
	}
	
	int p=0;
	// Getting parameters
	Local<Uint8Array> copyBuffer=Local<Uint8Array>::Cast(args[p]);p++;
	unsigned int width=Local<Integer>::Cast(args[p])->Value();p++;
	unsigned int height=Local<Integer>::Cast(args[p])->Value();p++;
	unsigned int depth=Local<Integer>::Cast(args[p])->Value();p++; // usually 32.
	int screen_number=(int)args[p]->ToInteger()->Value();p++; // the visual (default for the screen).

	if(args[p]->ToNumber()->Value()>0)
	{
		InitOpenGLDirect((GLenum)args[p]->ToInteger()->Value()); // the visual (default for the screen).
	}
	p++;

	// setting the attached data buffer. 
	shm_copybuffer= (char*)copyBuffer->Buffer()->GetContents().Data();

	// Create the image for copy purpuse. Will be larger usually then the actual window,
	// And will allow mutiple copy from the screen.
	shm_image=XShmCreateImage(display,
		DefaultVisual(display,screen_number),
		depth,ZPixmap,NULL,
		&shm_info,
		width,height);

	// creating the memory required.
	int bytesPerPixel = depth/8+(depth%8>0 ? 1 : 0);
	size_t memsize=bytesPerPixel*width*height;

	// creating the shared memory.
	int shm_info_index=CreateSharedMemory(memsize);
	if(shm_info_index<0)
		isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, 
			"Cannot create shared memory for pixmap.")));
	shm_info=shm_allocatedSharedMemoryInfo->at(shm_info_index);

	// attaching to helper pointers
	shm_data=shm_image->data=shm_info.shmaddr;

	// Attaching to server.
	bool attachOK=XShmAttach(display, &shm_info);

	// printing to console.
	printf("Shm attach %s\n.",attachOK ? "OK" : "FAIL!!!");

	// // creating the UInt8ClampedArray to return to node.
	// Local<Uint8Array> shm_data_array=Uint8Array::New(
	// 	ArrayBuffer::New(isolate,shm_data,memsize),
	// 	0,memsize);

	// pixmap is now ready. Retun the create info and data structure.
    Local<Object> rt = Object::New(isolate);
    rt->Set(String::NewFromUtf8(isolate,"IsOK"),Boolean::New(isolate,attachOK));
    rt->Set(String::NewFromUtf8(isolate,"Memory Size"),Integer::New(isolate,memsize));
    rt->Set(String::NewFromUtf8(isolate,"DataArraySharedMemoryIndex"),Integer::New(isolate,shm_info_index));
    //rt->Set(String::NewFromUtf8(isolate,"DataArray"),shm_data_array);
    args.GetReturnValue().Set(rt);
}


////////////////////////////////////////////
// Returns an ximage ready for the display inside a canvas.

// Nodejs Arguments : did,dest,dest_rowsize,xoffset,yoffset,width,height
// Return values: UInt8ClampedArray -> image data.
void DoCopySHMImageFromX(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = args.GetIsolate();
	// defining arrays.
	int p=0;
	Drawable wid=(Drawable)Local<Integer>::Cast(args[p])->Value();p++;
	Local<Uint8ClampedArray> destArray=Local<Uint8ClampedArray>::Cast(args[p]);p++;

	int rowsize=Local<Integer>::Cast(args[p])->Value();p++;
	int xoffset=Local<Integer>::Cast(args[p])->Value();p++;
	int yoffset=Local<Integer>::Cast(args[p])->Value();p++;
	int width=Local<Integer>::Cast(args[p])->Value();p++;
	int height=Local<Integer>::Cast(args[p])->Value();p++;

	// the destination array.
	char* dest= (char*)destArray->Buffer()->GetContents().Data();

	//XImage* img=XGetImage(display,did,xoffset,yoffset,width,height,0xffffffff,ZPixmap);
	//printf("Copy image: %d %d %d %d \n",xoffset,yoffset,width,height);
	shm_image->width = width;
	shm_image->height = height;
	bool isok = XShmGetImage(display,wid,shm_image,xoffset,yoffset,0xffffffff);

	// the number of pixels to copy.
	//int64_t byteRowSize=rowsize*4;
	int32_t pixelsCopied=0;
	if(isok)
	{
		pixelsCopied=doPixelCopy(shm_image->data,dest,rowsize,xoffset,yoffset,width,height,
			shm_image->depth>24);
	}
	else
	{
		printf("Failed top copy image into shared memory.\n");
		isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, 
					"Failed copying image into shared memory.")));
	}

	args.GetReturnValue().Set(Integer::New(isolate,pixelsCopied));

	//delete[] img;
//	delete[] rowsize,xoffset,width,height,
}

////////////////////////////////////////////
// Copies the iamge into the SHM data buffer. 

// Nodejs Arguments : wid,xoffset,yoffset,width,height
void DoCopyShmImageToDataBuffer(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = args.GetIsolate();
	// defining arrays.
	int p=0;

	Drawable wid=(Drawable)Local<Integer>::Cast(args[p])->Value();p++;
	int xoffset=Local<Integer>::Cast(args[p])->Value();p++;
	int yoffset=Local<Integer>::Cast(args[p])->Value();p++;
	int width=Local<Integer>::Cast(args[p])->Value();p++;
	int height=Local<Integer>::Cast(args[p])->Value();p++;

	//printf("Getting shared memory for %d %d %d %d\n",xoffset,yoffset,width,height);
	shm_image->width = width;
	shm_image->height = height;
	bool isok = XShmGetImage(display,wid,shm_image,xoffset,yoffset,0xffffffff);

	if(!isok)
	{
		printf("Failed top copy image into shared memory.\n");
		isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, 
					"Failed copying image into shared memory.")));
	}
	else
	{
		// need to copy buffer.
		size_t total_bytes=shm_image->bytes_per_line*height*sizeof(char);
		std::memcpy(shm_copybuffer,shm_data,total_bytes);
	}

	args.GetReturnValue().Set(Integer::New(isolate,width*height));
}

// Nodejs Arguments : wid,xoffset,yoffset,width,height
void DoCopyShmImageToTexture(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = args.GetIsolate();

	if(!opengl_initialized)
	{
		printf("ERROR: Attempted to write to shared texture without initializing opengl.\n");
		isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, 
					"Attempted to write to shared texture without initializing opengl.")));
		return;
	}
	int p=0;
	Drawable wid=(Drawable)Local<Integer>::Cast(args[p])->Value();p++;
	int xoffset=Local<Integer>::Cast(args[p])->Value();p++;
	int yoffset=Local<Integer>::Cast(args[p])->Value();p++;
	int width=Local<Integer>::Cast(args[p])->Value();p++;
	int height=Local<Integer>::Cast(args[p])->Value();p++;

	//printf("Getting shared memory for %d %d %d %d\n",xoffset,yoffset,width,height);
	shm_image->width = width;
	shm_image->height = height;
	bool isok = XShmGetImage(display,wid,shm_image,xoffset,yoffset,0xffffffff);

	if(!isok)
	{
		printf("ERROR: Failed top copy image into shared memory.\n");
		isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, 
					"Failed copying image into shared memory.")));
		return;
	}
	else
	{
		// need to copy buffer.
		size_t total_bytes=shm_image->bytes_per_line*height*sizeof(char);
		
		// copy to webgl texture if any.
		glTexSubImage2D(
			GL_TEXTURE_2D, // target
			0, // level
			xoffset, yoffset, // xoffset, yoffset
			width, height,  // width, height
			GL_RGBA, // format
			GL_UNSIGNED_BYTE, // type
			shm_image->data // the data to draw
			);
		glFinish();
	}

	args.GetReturnValue().Set(Integer::New(isolate,width*height));
}

////////////////////////////////////
// Node registration

void exiting() {
	printf("Cleaning up..\n");
	freeSharedImage();
	CleanSharedMemory();
}

void WDCppExtentions_init(Local<Object> exports) {
	
	// call for multiple threads in xorg.
	// since this is a node app, there may be multiple threads.
	XInitThreads();

	std::atexit(exiting);
  	NODE_SET_METHOD(exports, "PixmapToImageData", DoPixmapToImageDataCopy);
  	NODE_SET_METHOD(exports, "CopyImageFromX", DoCopyImageFromX);
  	NODE_SET_METHOD(exports, "ConnectToDisplay", DoConnectToDisplay);
  	NODE_SET_METHOD(exports, "GetSHMExtentionInfo", DoGetSHMExtentionInfo);
  	NODE_SET_METHOD(exports, "PrepareSHMImage",DoPrepareSHMImage);
  	NODE_SET_METHOD(exports, "CopySHMImageFromX",DoCopySHMImageFromX);
  	NODE_SET_METHOD(exports, "CopyShmImageToDataBuffer",DoCopyShmImageToDataBuffer);
  	NODE_SET_METHOD(exports, "CopyShmImageToTexture",DoCopyShmImageToTexture);
  	NODE_SET_METHOD(exports,"CheckCurrentGLContext",DoCheckCurrentGLContext);

}

NODE_MODULE(addon, WDCppExtentions_init)
	
}  // namespace demo