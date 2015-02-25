var $fh = require('fh-mbaas-api');
var mbaas = $fh.mbaasExpress();
var express = require('express');
var cors = require('cors');

// include the bread and butter of the app
var cloudRouter = require('./lib/cloud_router.js');

var app = express();

// Allow cross origin scripting
app.use(cors());

app.use('/sys', mbaas.sys(cloudRouter));
app.use('/mbaas', mbaas.mbaas);
app.use('/cloud', mbaas.cloud(cloudRouter));

app.use(mbaas.fhmiddleware());

// You can define custom URL handlers here, like this one:
app.use('/', function(req, res) {
    res.end('Your Cloud App is Running');
});

// Important that this is last!
app.use(mbaas.errorHandler());

var port = process.env.FH_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8001;
var host = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var server = app.listen(port, host, function() {
  console.log("App started at: " + new Date() + " on port: " + port); 
});
