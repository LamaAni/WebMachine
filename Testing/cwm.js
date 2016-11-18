// the object creation for window manager. 
var CompositingWindowManager = function(autoinit=true){

    // Connecting to the X11 service.
    this.X11 = require('x11');

    // Defining basic objects,
    this.XDisplay=null; // the display.;
    this.XClient=null; // the client (x client)
    this.XComposite=null; // the composition object. 
    this.XRender=null; // the render object;
    this.XRandr=null; // operations for window control? why is this called this way?
    this.AutoInit=autoinit; // if true then the object will auto initialize. 
    this.RootWindow=null; // the display root window.
    this.OverlayWindow=null; // the overlay window.
    this.DefaultRedirectEvents= 
        this.X11.eventMask.Button1Motion | 
        this.X11.eventMask.KeyPress | 
        this.X11.eventMask.KeyRelease | 
        this.X11.eventMask.ButtonPress | 
        this.X11.eventMask.ButtonRelease | 
        this.X11.eventMask.SubstructureNotify | 
        this.X11.eventMask.SubstructureRedirect | 
        this.X11.eventMask.Exposure;

    this.ManagedWindows={};
    this.ManagedWindowFrames={};
    this.WNDtoPID={};
    this.PIDtoWID={};
    this.Atoms={};
    var wm=this;

    // adding internal functions.
    function _do_init_check(){
        if(!wm.AutoInit)
            return;
        if(!wm.IsClientReady())
            return;

        // call to initialize the client;
        wm.Init();

        // clearing the wm function.
        wm=null; 
    }

    // creating the client objects.
    this.X11.createClient(function(err,display){
        wm.XDisplay=display;
        wm.XClient=display.client;
        
        wm.RootWindow=display.screen[0].root;
        wm.XClient.require('render',function(err,xrender){
            wm.XRender = xrender;
            _do_init_check();
        });
        wm.XClient.require('composite',function(err,xcomposite){
            wm.XComposite=xcomposite;
            console.log(wm.RootWindow);
            wm.XComposite.GetOverlayWindow(wm.RootWindow, function(err, overlayWnd){
                console.log(overlayWnd);
                wm.OverlayWindow=overlayWnd;
                 _do_init_check();
            });
        });
        wm.XClient.require('randr',function(err,xrandr){
            wm.XRandr=xrandr;
            _do_init_check();
        });
        wm.XClient.InternAtom(false,'_NET_WM_PID',function(err,atomid){
            wm.Atoms.PIdAtom=atomid;
            console.log('found pid atom, as ',atomid);
        });
    });
}

// Prototype functions.
CompositingWindowManager.prototype={
    ////////////////// X11 functions
    FindWindowByPId:function(pid){
        var matchID=null;
        var pidAtom=this.XClient.InternAtom(true,'_NET_WM_PID');

        // finding the window in the tree.
        var me=this;
        this.XClient.QueryTree(thsi.RootWindow, function (err, tree) {
            for(var i=0;i<tree.children.length;i++)
            {
                var wid=tree.children[i];
            }
        });
        return matchID;
    },

    ////////////////// Client functions
    IsClientReady:function(){
        return this.XComposite != null && this.XRender!=null && 
            this.XClient !=null && this.XDisplay!=null && this.XRandr!=null && this.OverlayWindow !=null;
    },

    ////////////////// Window manager functions
    // Set the window events such as they would pass to the underlining windows.
    AllowWindowInputPassthrough:function(wnd){
        // not implemented since I dont have some of the functions.. will do later.
        console.warn('AllowWindowInputPassthrough is not implemented since example functions are not available.');
    },
    // call to prepare the overlay window.
    PrepOverlay:function(){
        this.AllowWindowInputPassthrough(this.OverlayWindow);
        var EventEmitter=new require('events').EventEmitter;

        // adding events handlers for overlay window.
        this.XRandr.SelectInput(this.OverlayWindow,this.X11.eventMask.KeyPress, this.X11.eventMask.PointerMotion);
        // this.XClient.ChangeWindowAttributes(this.OverlayWindow,{eventMask:this.DefaultRedirectEvents});
        // this.XClient.even_consumers[this.OverlayWindow]=new EventEmitter();
        // var me=this;
        // this.XClient.even_consumers[this.OverlayWindow].on('KeyPress',function(ev){
        //     if(ev.keycode!=32)
        //         return;
        //     me.XClient.UnmapWindow(me.OverlayWindow);
        //     console.log('overlay hidden');
        // });
    },
    // Called to prep the window compsoition
    PrepComposition:function(){

    },
    // Call to prep the root window.
    PrepRoot:function(){
        this.XComposite.RedirectSubwindows(this.RootWindow,this.XComposite.Redirect.Automatic);
        this.XClient.ChangeWindowAttributes(this.RootWindow,{eventMask:this.DefaultRedirectEvents},function(err){});
    },

    CreateDefaultRenderPicture:function()
    {
        var picId=this.XClient.AllocID();
        this.XRender.RadialGradient(picId, [26,26], [26,26], 0, 26,
        [
            [0,   [0,0,0,0x0fff ] ],
            [0.3,   [0,0,0,0x0fff ] ],
            [0.997,   [0xffff, 0xf, 0, 0x1] ],
            [1,   [0xffff, 0xffff, 0, 0x0] ]
        ]);

        this.WindowPictureToDraw={
            pid:picId,
            x:300,
            y:300,
            width:52,
            height:52,
            format:this.XRender.rgb24,
        };
    },

    TestRenderOnOverlay:function(){
        console.log('Checking rendering onto overlay window');
        if(this.WindowPictureToDraw==null)
            this.CreateDefaultRenderPicture();
        var pic=this.WindowPictureToDraw;     
        var x=0;
        var y=0;
        var width = 300;
        var height = 300;
        var format=this.XRender.rgb24;

        // the overlay pictuer id.
        var imgid=this.XClient.AllocID();
        this.XRender.CreatePicture(imgid,this.OverlayWindow,pic.format);
        this.XRender.Composite(
            this.XRender.PictOp.Over, 
            pic.pid, 
            0, // no mask.
            imgid, // to the overlay window.
            0, // location on the picture x. 
            0,  // location on the picture y.
            0, // mask locx 
            0, // mask locy
            pic.x, // loc on overlay
            pic.y, 
            pic.width, 
            pic.height
            );
        console.log('Render ontop of overlay window success.');
    },

    SpawnNWWindow:function(){
        
        const spawn = require('child_process').spawn;
        this.OverlayBrowserProcess=spawn('nw',['browser_overlay']);
        console.log('starting node webkit overlay window.', this.OverlayBrowserProcess);
    },

    ManageWindow:function(wid){
        var me=this;
        this.XClient.GetProperty(0,wid,this.Atoms.PIdAtom, this.XClient.atoms.CARDINAL, 0,1, function(err,prop){
            // reading the pid assciated with the window id, if possible.
            var pid=prop.data.readUIntLE(0,4).toString();
            me.WNDtoPID["w"+wid]="p"+pid;
            me.PIDtoWID["p"+pid]="w"+wid;

            if(me.OverlayBrowserProcess!=null && pid==me.OverlayBrowserProcess.pid)
            {
                // call to setup the overlay window.
                me.OverlayBrowserWindowID=wid;
                function callInitOverlay(){
                    me.InitializeOverlayWindow();
                }
                setTimeout(callInitOverlay,1);
                console.log('Overlay browser has been loaded, waiting for initialization.');
            }
            else {
                me.XClient.MapWindow(wid);
                console.log('New window with wid='+wid+', of process '+pid+'has been managed');
            }
        });

        // doing a test for the window redirect over the overlay. 
        this.XClient.GetGeometry(wid,function(err, attr){
            console.log(attr);
            var wformat=attr.depth==24? me.XRender.rgb24 : me.XRender.rgba32;
            var windowPicID=me.XClient.AllocID();
            me.XRender.CreatePicture(windowPicID,wid,wformat);

            console.log('picture created');
            // creating the pictrue to read the image of the window from.
            
            me.WindowPictureToDraw={
                pid:windowPicID,
                x:100,
                y:100,
                width:attr.width,
                height:attr.height,
                format:wformat
            };
        });
    },

    // Call to initialize the browser window
    InitializeOverlayWindow:function(){
        // need to initialize the overlay window, therefore we need to reparent the browser window onto the overlay.
        var X=this.XClient;
        var wid=this.OverlayBrowserWindowID;
        var fid=this.OverlayWindow;
        X.ChangeSaveSet(1, wid);
        X.ReparentWindow(wid, fid, 1, 21);
        X.MapWindow(fid);
        X.MapWindow(wid);

        console.log("Overlay browser initialized.");
    },

    ////////////////// Window manager initialization
    Init:function(){
        console.log('Window manager object ready. Gaining control of windows...');
        this.PrepRoot();
        this.PrepOverlay();

        // getting the overlay properties. 

        // test render on overlay.
        //this.TestRenderOnOverlay();
        var overlayIsMapped=false;
        this.XClient.UnmapWindow(this.OverlayWindow);
        this.XClient.SetInputFocus(this.RootWindow,0);
        var me=this;
        this.XClient.on('event',function(ev){
            if(ev.type==20)
            {
                // map request. need to manage window if not managed before.
                me.ManageWindow(ev.wid);
                return;
            }
            if(ev.name!='KeyPress')
                return;
            console.log(ev);
            switch (ev.keycode)
            {
                case 32:
                {
                    
                    if(overlayIsMapped)
                    {
                        me.XClient.UnmapWindow(me.OverlayWindow);
                        console.log('Overlay hidden');
                        overlayIsMapped=false;
                    }
                    else
                    {
                        me.XClient.MapWindow(me.OverlayWindow);
                        me.TestRenderOnOverlay();
                        console.log('Overlay shown');
                        overlayIsMapped=true;
                    }
                }
                break;
                case 57:
                    me.SpawnNWWindow();
                break;
            }
        });
        console.log('Press O to show/hide overlay. Press N to start overlay browser.');
        //this.SpawnNWWindow();
    },
};

var WM=new CompositingWindowManager(true);
