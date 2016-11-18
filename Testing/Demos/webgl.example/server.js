//Require the module 
ServeMe = require("serve-me");
 
//Set the options 
var serveMe = ServeMe({
    debug: true,
        /**If debug mode is enabled, it will load each file again every http request, else the files will wait in cache.
         * Also prints more logs
        **/
 
    log: false,
        //(Optional) If log is enabled the server reports all the files served and more information. 
 
    home: "example.html",
        //(Optional) home will change the html file served in "/" (by default: 'index.html') 
 
    directory: "./",
        //(Optional) directory will change the default public folder ('./public') 
 
    error: {
        // 404: "404.html",
        // 500: "500.html"
        /**Error pages depending on the error code.
         * That specified files must exist in the 'public/error' folder.
         *     Model: 'errorcode': "file.html"
        **/
    },
 
    //(Optional) 
    secure: false,
        //Will use https when enabled. 
        //ATENTION: A key and a certificate must be provided. 
    //By default serve-me will use: 
    // key: "./keys/key.pem",
    // cert: "./keys/cert.pem",
});
 
//Also you can add a callback to wait for the server to start. 
serveMe.start(3000, function(){
    console.log("Server ready.");
});