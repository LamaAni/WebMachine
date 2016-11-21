// code filefor app test GLX. 
$(function(){
// adding exit btn.
$("#btnExit").click(function(){
	process.exit(0);
});
// loading core packages.
var x11=require("x11");
var testGLX=require('../cpp_modules/build/Release/TestGLX.node');

// call to validate test glx is active.
testGLX.Validate();
// globlal variables
var X;
var root;
var screen;

// Starting the x server and creating a new window.
x11.createClient(function (err, display) {
    X = display.client;
// loading extentions
X.require('composite', function (err, Composite) {
X.require('damage', function (err, Damage) {
X.require('render', function (err, Render) {

	// core app starts here.
	X.Composite=Composite;
	X.Damage=Damage;
	X.Render=Render;

    // getting the display client.

    root=display.screen[0].root;
    screen=display.screen[0];
    // print ok.
    console.log('Root wnd id: ',root);

    // creating the clone to window.
    var wid=X.AllocID();
	X.CreateWindow(wid, display.screen[0].root, 100, 100, 400, 300,0,0,0,0);
	X.MapWindow(wid);

	// initialize for display 0, screen 0, window id.
	$("#btnBind").click(function(){
		var targetText=$("#txtBindID").val().trim();
		var targetId=parseInt(targetText);
		if(targetText=="" || targetId==NaN)
		{
			alert('No bind window found.');
			return;
		}
		testGLX.Initialize(0,0,wid,targetId);
	});

})})})});
});