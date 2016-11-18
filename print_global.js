console.log('Starting window manager at ',process.cwd());
console.log('Node Path :',process.env.NODE_PATH);
console.log('Available paths:',module.paths);

if(process.argv.length>2)
{
	console.log('Attempting to load provided modules,')
	for(var i=2;i<process.argv.length;i++)
	{
		console.log('Loading module '+process.argv[i]);
		var module = require(process.argv[i]);
	}
}