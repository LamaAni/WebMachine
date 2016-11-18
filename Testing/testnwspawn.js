const spawn = require('child_process').spawn;
spawn('nw',['browser_overlay','--ignore-gpu-blacklist']);