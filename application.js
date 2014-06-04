var mbaas = require('fh-mbaas-express');
var express = require('express');
var cloudRouter = require('./lib/cloud_router.js');

var app = express();
app.use('/sys', mbaas.sys(cloudRouter));
app.use('/mbaas', mbaas.mbaas);
app.use('/cloud', mbaas.cloud(cloudRouter));

// app.use(mbaas.fhmiddleware());

// You can define custom URL handlers here, like this one:
app.use('/', function(req, res) {
    res.end('Your Cloud App is Running');
});

// Important that this is last!
app.use(mbaas.errorHandler());

var port = process.env.FH_PORT || process.env.VCAP_APP_PORT || 8001;
var server = app.listen(port, function() {
    console.log("App started at: " + new Date() + " on port: " + port);
});