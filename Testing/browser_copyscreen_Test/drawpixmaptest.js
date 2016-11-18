function InitComposition()
{
// marking this session is nodejs available.
	$('#nodeactive_ok_boc').css('background-color','green');
	// binding devtools 
	$('#btn_show_devtools').click(function(){
		require('nw.gui').Window.get().showDevTools();
	});

	var tick_counters={};

	function tic(name){
		if(name==null)
			name='___________default';
		tick_counters[name]=window.performance.now();
	}

	function toc(name){
		if(name==null)
			name='___________default';
		return window.performance.now()-tick_counters[name];
	}

	//var webglCanvasQuery=$('#webgl_canvas');
	//console.log(webglCanvasQuery[0].getContext('webgl'));

	// the canvas to draw on.
	var WebGLCompositor=require('../webgl.composite/webgl.compositor.js');
	var cppExtend=require('../cpp_modules/build/Release/WdCPPExtend.node');
	var x11 = require('x11');
	var EventEmitter = require('events').EventEmitter;


	var canvasQuery=$('#test_canvas');

	cppExtend.CheckCurrentGLContext();
	var ctx=canvasQuery[0].getContext('experimental-webgl',{ 
					antialias: false,
                	preserveDrawingBuffer:true, 
                });
	cppExtend.CheckCurrentGLContext();

	var imageData=null;
	var imageBitmap=null;
	console.log(ctx);
	console.log(ctx.getSupportedExtensions());
	console.log(ctx.getExtension('WEBGL_shared_resources'));
	var glc=new WebGLCompositor(ctx);
	window.glc=glc;
	var X;

	// checking the generated texture id.
	cppExtend.CheckCurrentGLContext(glc.TextureID);

	function GetEventHandler(wid)
	{
		var ee=X.event_consumers[wid];
        if (ee == null) {
        	ee= new EventEmitter();
            X.event_consumers[wid] =ee;
        }
        return ee;
	}

	function ConvertImageMatrix(source,dest,rowsize,xoffset,yoffset,width,height,depth,do_in_js=false)
	{
		var hasAlpha=depth==32;
		var copied=0;var i=0;var si=0;
		tic('CopyTime');
		if(!do_in_js)
		{
			copied=cppExtend.PixmapToImageData(source,dest,rowsize,xoffset,yoffset,width,height,hasAlpha);
		}
		else for(var y=0;y<height;y++)
		{
			var dypos=(yoffset+y)*rowsize;
			var sypos=y*width;
			for(var x=0;x<width;x++)
			{
				// location.
				i=(dypos+xoffset+x)*4;
				si = (sypos+x)*4;

				dest[i]=source[si+2];
				dest[i+1]=source[si+1];
				dest[i+2]=source[si];
				if(hasAlpha)
				{
					dest[i+3]=source[si+3];
				}
				else dest[i+3]=255;
				//dest[i+3]=hasAlpha ? source[i+3] : 255;
				copied++;
			}
		}
		var time = toc('CopyTime');
		if(time>10)
			console.warn('Long pixel copy time '+copied+' pixels in [ms] ',time);
	}

	var isUpdatingRegion=false;
	var WindowInvalidationRect=function(maxX=Infinity,maxY=Infinity){
		this.x=0;
		this.y=0;
		this.w=0;
		this.h=0;
		this.IsValid=true;	
		this.IsUpdating=false;
		this.MaxX=maxX;
		this.MaxY=maxY;
		this.UpdateTimeout=10; // in ms.
	}
	WindowInvalidationRect.prototype={
		InvalidateRect:function(x,y,w,h){
			if(this.IsValid)
			{
				this.x=x;this.y=y;this.w=w;this.h=h;
			}
			else
			{
				this.x=this.x<x ? this.x : x;
				this.y=this.y<y ? this.y : y;

				var fx=w+x;
				var fy=y+h;
				if(this.x+this.w<fx)
					this.w=fx-this.x;
				if(this.y+this.h<fy)
					this.h=fy-this.x;
			}

			if(this.x>this.MaxX || this.y>this.MaxY)
			{
				this.Validate();
				return;
			}
			
			if(this.x+this.w > this.MaxX)
			{
				this.w=this.MaxX-this.x;
			}

			if(this.y+this.h > this.MaxY)
			{
				this.h=this.MaxY-this.y;
			}

			this.IsValid=false;
		},
		SetActiveRegion:function(maxX,maxY)
		{
			this.MaxX=maxX;
			this.MaxY=maxY;
		},
		Validate:function(){this.IsValid=true;},
		DrawRequired:function(){return !this.IsValid && this.w>0 && this.h>0;},
		Update:function(X, wid, force=false){
			if(!force && (this.IsUpdating || !this.DrawRequired()))
				return; // update already in progress or no update needed.
			this.IsUpdating=true;
			var me=this;
			
			function do_NextUpdate()
			{
				if(!me.DrawRequired())
				{
					me.IsUpdating=false;
				}
				else me.Update(X,wid,true);
			}

			// copying the current update.
			var x=this.x;var y=this.y; var width=this.w; var height=this.h;

			// Markign the old region as ok.
			me.Validate();

			tic('Copy from x');

/*				cppExtend.CopyImageFromX(wid,imageData.data,
				imageData.width,x,y,width,height);
*/
			// cppExtend.CopySHMImageFromX(wid,imageData.data,
			// 	imageData.width,x,y,width,height);

			// call top copy the image into the buffer.
			var pixelsCopied=cppExtend.CopyShmImageToTexture(wid,x,y,width,height);

			var copyTime=toc('Copy from x');
			if(copyTime>10)
			{
				console.warn('Slow responce at copy damaged window pixels from x', copyTime);
			}

			tic('PutImageData');

			//var memSize=pixelsCopied*4;
			//var imgDataCopy=new Uint8Array(imageData,0,memSize);

			//console.log(imgDataCopy,imageData);
			//console.log('Draw on ',x,y,width,height);
			glc.DrawImage(x,y,width,height,null);//imageData.Buffer);
			
			//draw the image.
			// createImageBitmap(imageData).then(function(img){
			// 	ctx.drawImage(img,x,y,width,height,x,y,width,height);
			// });

			// ctx.drawImage(imageBitmap,x,y,width,height,x,y,width,height);
			// ctx.putImageData(imageData,0,0,x,y,width,height);
			// ctx.strokeRect(x,y,width,height);

			var pimt=toc('PutImageData');
			if(pimt>10)
				console.warn('Slow responce at drawImage in [ms]',pimt);

			// wait to see if a newer update is needed.
			//setTimeout(do_NextUpdate, me.UpdateTimeout);
			window.requestAnimationFrame(do_NextUpdate);
			// return;
		},
	};

	var wVRect=new WindowInvalidationRect();

	// Cllaed to updte a specific window region onto the canvas. 
	function updateWindowRegion(X, wid, x, y, width,height)
	{
		wVRect.InvalidateRect(x,y,width,height);
		wVRect.Update(X,wid);
	}

	var boundDamageDrawable=-1;
	var boundDamageXId=-1;

	function BindDisplayToWindow(wid, damage)
	{
		// binds the display to the specified window.
		X.GetWindowAttributes(wid,function(err,wndAttrib){
		X.GetGeometry(wid, function(err, wndGeom) {
			if(err!=null)
			{
				console.log(err);
				return;
			}

			console.log('Attaching to window '+wid, 'Geometery info:', wndGeom,
				' attributes: ',wndAttrib);

			boundDamageDrawable=wid;

			// updating the canvas size to the current root geom.
			//var aspectRatio=wndGeom.width*1.0/wndGeom.height;
			var width=wndGeom.width;
			var height=wndGeom.height;
			var depth=32;
			canvasQuery.attr('width',width+'px');
		    canvasQuery.attr('height',height+'px');
		    canvasQuery.width(width);
			canvasQuery.height(height);
		    //canvasQuery.width(rootGeometry.width);
		    //canvasQuery.height(canvasQuery.width()/aspectRatio);

		    // create the associated new image data.
		    //imageData=ctx.createImageData(wndGeom.width,wndGeom.height);

		    // setting the active region to apply to the window.
		    wVRect.SetActiveRegion(width,height);

		    // setting the viewport for the webgl.
		    glc.SetViewport(0,0,width,height);

		    // creating the damage watch.
			var boundDamageXId=X.AllocID();
			damage.Create(boundDamageXId,wid,damage.ReportLevel.RawRectangles); 

			// call to do updating.
		    updateWindowRegion(X,wid,0,0,width,height);
		    console.log('Updating window info started.');

		  //   createImageBitmap(imageData).then(function(img){
		  //   	imageBitmap=img;

		  //   	console.log('Image bitmap created (',typeof imageBitmap,'), ',imageBitmap);
		   
			 //    // creating the damage watch.
				// var boundDamageXId=X.AllocID();
				// damage.Create(boundDamageXId,wid,damage.ReportLevel.RawRectangles); 

				// // update the window.
				// updateWindowRegion(X,wid,0,0,wndGeom.width,wndGeom.height);
				// console.log('Updating window info started.');
		  //   });
		})});
	}

	function UpdateBoundWindow(ev){
		if(ev.area.w<=0 || ev.area.h <=0)
			return;
		updateWindowRegion(X,boundDamageDrawable,ev.area.x,ev.area.y,ev.area.w,ev.area.h);
	}

	// binding to x-client.
	x11.createClient(function(err,display){ 
		
		X=display.client; // set the client.
		var root = display.screen[0].root;
		
		var copyWindowMaxWidth=2000;
		var copyWindowMaxHeight=2000;
		var screenDepth=32;
		var depthBytes = Math.floor(screenDepth/8)+(screenDepth%8>0?1:0);
		var bufferImageBytes=copyWindowMaxWidth*copyWindowMaxHeight*depthBytes;

		// connecting cpp to the current display.
		console.log('Cpp connected to display with the link:',
			cppExtend.ConnectToDisplay(parseInt(X.displayNum),parseInt(X.screenNum)));

		// validating shm extention exists.
		console.log('SHM extention info,',cppExtend.GetSHMExtentionInfo());

		// checking the generated texture id.
		cppExtend.CheckCurrentGLContext(glc.TextureID);
		// var shmKey= shm.create(bufferImageBytes,shm.BufferType.Uint8Array);
		// console.log(shm.get(shmkey));
		//imageData = new Uint8Array(bufferImageBytes);
		 //new Uint8Array(bufferImageBytes);

		// imageData = cppExtend.CreateSharedMemoryBuffer(bufferImageBytes);

		imageData={
			Buffer: new Uint8Array(bufferImageBytes),
			MemorySize : bufferImageBytes,
		}		

		imageData.maxWidth=copyWindowMaxWidth;
		imageData.maxHeight=copyWindowMaxHeight;
		console.log('Memory copy buffer ready.', imageData);

		// prepare shm image copy.
		var shmImage=cppExtend.PrepareSHMImage(
			imageData.Buffer, copyWindowMaxWidth,copyWindowMaxHeight,screenDepth,0,glc.TextureID);

		console.log('Shared memory XImage ready.',shmImage);

	
		X.require('composite',function(err,composite){
		X.require('damage',function(err,damage){
			// we cannot bind to events since event structure may be bound to another window manager.
			// therefore I need to just query the desktop and display changes.

			// binding to root damage events.

			// adding event handler for the root window.
			var haslog=false;
			X.on('event',function(ev){
				//damage.Subtract(boundDamageXId,0,0);
				//console.log(ev.name,ev);
				if(ev.damage!=null && ev.name=='DamageNotify' && ev.drawable==boundDamageDrawable)
				{
					UpdateBoundWindow(ev);
				}
			});

			$('#btn_bindtownd').click(function(ev){
				var wid=parseInt($('#wndBindID').val());
				BindDisplayToWindow(wid,damage);
			});
		})});
	});
}

$(document).ready(function(){
	if(typeof require == "undefined")
	{
		$('#nodeactive_ok_boc').css('background-color','red');
		console.log('Node js dose not exist. Ignoring node load.');
	}
	else
	{
		window.setTimeout(InitComposition,1000);
	}		
});
