// Testapp to check the speed of pixelcopy.
var cppm=require('./build/Release/WdCPPExtend.node');

// testing array copy.
var width=10000;var height=10000;
var byteCount=width*height*4;

console.time('create');
var uint8ar=new Uint8Array(byteCount);
var uint8ClampedAr=new Uint8ClampedArray(byteCount);
// var uint8ClampedArNodeCopy=new Uint8ClampedArray(N);
console.timeEnd('create');

console.time('setup numbers');
for(var i=0;i<byteCount;i++)
{
	uint8ar[i]=Math.round(i%255);
}

console.timeEnd('setup numbers');

console.time('copycpp');
var copied=cppm.PixmapToImageData(uint8ar,uint8ClampedAr,width,0,0,width,height,true);
console.timeEnd('copycpp');
console.log('Copied '+copied+' pixels');

//console.log(uint8ClampedAr);
console.time('compare&validate');
var ok=true;
for(var i=0;i<byteCount;i+=4)
{
	if( uint8ClampedAr[i]	!=uint8ar[i+2] 	||
		uint8ClampedAr[i+1]	!=uint8ar[i+1]	||
		uint8ClampedAr[i+2]	!=uint8ar[i]	||
		uint8ClampedAr[i+3]	!=uint8ar[i+3])
	{
		console.log('Item at pos '+i+' was not copied properly '+uint8ClampedAr[i]+'!='+uint8ar[i]);
		ok=false;
		break;
	}
}
if(ok)
	console.log('Copy success.');
console.timeEnd('compare&validate');

// console.time('copy node');
// for(var i=0;i<N;i++)
// {
// 	uint8ClampedArNodeCopy[i]=uint8ar[i];
// }
// console.timeEnd('copy node');