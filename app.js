
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
var querystring = require("querystring");
var http = require('http');
var mongoose = require('mongoose');

var port = process.env.PORT || 3000;

var db = mongoose.connect('mongodb://shrikar:shrikar@ds033037.mongolab.com:33037/events');
var Schema = mongoose.Schema;
var app = module.exports = express.createServer();
var url = require("url");

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

var OptionalKeyVal = new Schema({'subkey':String, 'subvalue':Number});

var events = new Schema({'user_id': String,
                          'key':String,
                          'value':Number,
                          'optional': [ OptionalKeyVal],
                          date : { type : Date, default: Date.now}
                         });
var EventDB = mongoose.model('EventDB', events);

app.post('/saveEvent', function(req,res){

	console.log(req.body.user_id);
	console.log(req.body.key);
	console.log(req.body.value);
	var list = req.body.optional;

	var edited = list.substr(1,list.length-2).replace(/{|}|\s/gi,'').split(',');
    console.log("############## :" + edited);
	var elem = [];
	for (var i = 0; i < edited.length ; i = i+2){
		var el = {'subkey':edited[i], 'subval':edited[i+1]}
		elem.push(el);
	}
	var record = new EventDB({ 'user_id': req.body.user_id, 'key' : req.body.key, 'value' : req.body.value, 'optional' : elem});
	record.save();
	console.log(record);
	res.writeHeader(200,'OK');
    res.write("Event Saved.\n");
    res.end();
       
});

app.get('/getEvent', function(req,res){
	var qs = url.parse(req.url).query;
	var user_id = querystring.parse(qs)["user_id"];
    var key = querystring.parse(qs)["key"];
    var start = querystring.parse(qs)["start"];
    var end = querystring.parse(qs)["end"];

    var sum = 0;
	console.log(user_id);
    var finder = mongoose.model('EventDB');

    var query = finder.find({});
    console.log("key:" + key);
	query.where('user_id',user_id).or([{"key": key },{"optional.subkey":key}]).gte("date",start).lte("date",end).
	only(["key","value","optional.subkey","optional.subval"]);

	query.run( function(err,docs){
		
		for(var items in docs) {
			console.log(docs[items]);
			var gkey = docs[items]["key"];
			var val = parseInt(docs[items]["value"]);
			var optional = docs[items]["optional"];

			if( key === gkey){
				console.log("Adding:" + val);
				sum = sum + val;
			}
			for(var i = 0; i < optional.length; i++){
				var obj = JSON.stringify(optional[i]);
				var x = JSON.parse(obj);
				if(x.subkey === key){
					console.log("Adding" + x.subval);
					sum = sum + parseInt(x.subval);
				}
				
			}
	   }
	   console.log("Sum :" + sum);
       var result = {"sum" : sum};
	   res.writeHeader(200,'OK');
       res.write(JSON.stringify(result)+"\n");
       res.end();
	});

});
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
