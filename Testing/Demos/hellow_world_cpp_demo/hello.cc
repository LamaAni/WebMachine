// hello.cc
#include <node.h>

namespace HelloWorldDemo {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Uint8Array;
using v8::Uint8ClampedArray;
using v8::Value;
using v8::Integer;

void HelloWorldExampleCallMethod(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, "world"));
}

void CopyUint8ToUint8ClampedArray(const FunctionCallbackInfo<Value>& args)
{
	// defining arrays.
	Local<Uint8Array> sourceArray=Local<Uint8Array>::Cast(args[0]); 	
	Local<Uint8ClampedArray> destArray=Local<Uint8ClampedArray>::Cast(args[1]);
	int64_t length=Local<Integer>::Cast(args[2])->Value();

	uint8_t* source= (uint8_t*)sourceArray->Buffer()->GetContents().Data();
	uint8_t* dest= (uint8_t*)destArray->Buffer()->GetContents().Data();

	// doing the loop.
	for(int64_t i=0;i<length;i++)
	{
		dest[i]=source[i];
	}
}

void init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "hello", HelloWorldExampleCallMethod);
  NODE_SET_METHOD(exports, "CopyUint8ToUint8ClampedArray", CopyUint8ToUint8ClampedArray);
}

NODE_MODULE(addon, init)

}  // namespace demo