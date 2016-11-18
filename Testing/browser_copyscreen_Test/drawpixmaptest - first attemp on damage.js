$(document).ready(function(){
	console.log('Loaded draw pixmap test');
	if(typeof require == "undefined")
	{
		$('#nodeactive_ok_boc').css('background-color','red');
		console.log('Node js dose not exist. Ignoring node load.');
	}
	else
	{
		$('#nodeactive_ok_boc').css('background-color','green');
		$('#btn_show_devtools').click(function(){
			require('nw.gui').Window.get().showDevTools();
		});

		var x11 = require('x11');
		var fs = require('fs');
		var ImageJS=require("imagejs");
		var EventEmitter = require('events').EventEmitter;

		var managedWindows={};

		// redirect mask for the redirect events.
	    var DefaultRedirectEvents= 
	        x11.eventMask.Button1Motion | 
	        x11.eventMask.KeyPress | 
	        x11.eventMask.KeyRelease | 
	        x11.eventMask.ButtonPress | 
	        x11.eventMask.ButtonRelease | 
	        x11.eventMask.SubstructureNotify | 
	        x11.eventMask.SubstructureRedirect | 
	        x11.eventMask.Exposure;

		// the canvas to draw on.
		var canvasQuery=$('#test_canvas');
		var ctx=canvasQuery[0].getContext('2d');

		// Cllaed to updte a specific window region onto the canvas. 
		function updateWindowRegion(X, wid, x, y, width,height)
		{
			// updating the coordinated image.
    		X.GetImage(2, root, x, y, width, height, 0xffffffff, function(err,image) {

    			// after getting the image we need to transfer it to the 
   				img_data=new ImageData(new Uint8ClampedArray(image.data),width,height);
   				ctx.putImageData(img_data,0,0);
        	});
		}

		function manageWindow(X,wid, resize=true, bind_damage=false)
		{			
			managedWindows[wid]=true;
			var ee=X.event_consumers[wid];
            if (ee == null) {
            	ee= new EventEmitter();
                X.event_consumers[wid] =ee;
            }

	    	if(bind_damage)
	    	{
	    		console.log('Creating damage watch for window '+wid);
	    		var wdamage=X.AllocID();
		        X.XDamage.Create(wdamage, wid, X.XDamage.ReportLevel.NonEmpty);

			    // handeling the expose events.
		        ee.on('event',function(ev){
		        	X.XDamage.Subtract(wdamage, 0, 0);
		        	console.log(ev.name+":",ev);
		        });

		        X.ChangeWindowAttributes(wid, 
		        	{ eventMask: 
		        		x11.eventMask.Exposure | 
		        		x11.eventMask.Button1Motion | 
		        		x11.eventMask.KeyPress | 
		        		x11.eventMask.SubstructureNotify | 
		        		x11.eventMask.SubstructureRedirect }, 
		        	function (err) {
		        		console.log('Error while attempting to assign window event mask.',err);
		        	}
		        );
	    	}
	    	else
	    	{
	    		ee.on('event',function(ev){
		        	console.log(ev.name+":",ev);
		        });
		        X.ChangeWindowAttributes(wid, 
		        	{ eventMask: 
		        		x11.eventMask.Exposure |  
		        		x11.eventMask.SubstructureRedirect }, 
		        	function (err) {
		        		console.log('Error while attempting to assign window event mask.',err);
		        	}
		        );
	    	}

        	// call and wait for callback. 
        	X.GetGeometry(wid, function (err, clientGeom) {
            	// got the window geometry.
	           	var width = 400;
	            var height = 400;
	            winX = clientGeom.xPos;
	            winY = clientGeom.yPos;
	            if(resize)
	            	X.ResizeWindow(wid, width, height);
	        	X.MapWindow(wid);
	    	});
		}

		x11.createClient(function(err, display) {
			console.log('Client created.');
		    var X = display.client;
		    var root = display.screen[0].root;

		    // calling to require the X compisite and updating the events.

	        X.require('damage', function(err, xdamage) {
		    X.GetGeometry(root, function(err, clientGeom) {
		    X.require('composite',function(err,xcomposite){

		    	console.log('Found client root geometry and initialized extention compisite');
		    	// setting the XComposition and rendering to backend pixmapx. 
		    	X.XComposite=xcomposite;
		        X.XComposite.RedirectSubwindows(root,X.XComposite.Redirect.Automatic);
		        X.XDamage=xdamage;

		        console.log('Redirected composition of all windows to pixmaps.');

		        // catching events.
        		X.ChangeWindowAttributes(root,
        			{eventMask:DefaultRedirectEvents},function(err){
        				if(err!=null)
        				{
        					console.log('Another window manager is running, cannot redirect events.',err);
        				}
        				else console.log('Catching all events for all windows.');
        			});

        		// updating the canvas area size to the root window size.
			    canvasQuery.attr('width',clientGeom.width+'px');
		        canvasQuery.attr('height',clientGeom.height+'px');

                // checking out the current window tree and managing any existing windows.
                window.setTimeout(function(){
 		        X.QueryTree(root, function (err, tree) {
		            tree.children.forEach(function(wid){manageWindow(X,wid,false,true);});
		        });
 		    	},1000);

                //X.damageID=X.AllocID();
	    		//var rootDamage = X.AllocID();
		        //X.XDamage.Create(rootDamage, root, X.XDamage.ReportLevel.NonEmpty);

		        var i=0;
		        X.on('event',function(ev){
		        	//X.XDamage.Subtract(X.damageID, 0, 0);
		        	if (ev.type === 20)        // MapRequest
			        {
			            //console.log(ev.type+ ": Map request.");
			            // called when the window presents itself. We go to manage the window event.
			            if (managedWindows[ev.wid]==true)
			            	return;
			            manageWindow(X,ev.wid);
			            
			        }
			        console.log(ev.name+":",ev);
		        });               	

		    })})});
		}).on('error', function(err) {
		    console.log(err);
		});
	}
});
