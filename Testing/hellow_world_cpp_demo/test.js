var HelloWorldModule=require('./build/Release/HelloWorldExample.node');
console.log(HelloWorldModule.hello());

// testing array copy.
var N=2000*2000*4; 
console.time('create');
var uint8ar=new Uint8Array(N);
var uint8ClampedAr=new Uint8ClampedArray(N);
var uint8ClampedArNodeCopy=new Uint8ClampedArray(N);
console.timeEnd('create');

console.time('setup numbers');
for(var i=0;i<N;i++)
{
	uint8ar[i]=Math.round(Math.random()*255);
}

console.timeEnd('setup numbers');

console.time('copycpp');
HelloWorldModule.CopyUint8ToUint8ClampedArray(uint8ar,uint8ClampedAr,N);
console.timeEnd('copycpp');

//console.log(uint8ClampedAr);
console.time('compare&validate');
for(var i=0;i<N;i++)
{
	if(uint8ClampedAr[i]!=uint8ar[i])
	{
		console.log('Item at pos '+i+' was not copied properly '+uint8ClampedAr[i]+'!='+uint8ar[i]);
		break;
	}
}
console.timeEnd('compare&validate');

console.time('copy node');
for(var i=0;i<N;i++)
{
	uint8ClampedArNodeCopy[i]=uint8ar[i];
}
console.timeEnd('copy node');