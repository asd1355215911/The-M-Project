var express      = require('express');
var server          = express();
var http_server  = require('http').createServer(server);
var sockets      = require('./sockets.js').listen(http_server);
var rest         = require('./mongodb_rest.js').create("test");

http_server.listen(8100);

server.use(express.static(__dirname + '/public/'));
server.use(express.bodyParser());

//Find documents
server.get("/:name", function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    rest.find(req, res);
});

//Find a specific document
server.get('/:name/:id', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    rest.findOne(req, res);
});

//Create document(s)
server.post('/:name', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    rest.create(req, res);
});

//Update a document
server.put('/:name/:id', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    rest.save(req, res);
});

//Delete a document
server.delete('/:name/:id', function(req, res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    rest.delete(req, res);
});
