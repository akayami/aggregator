/**
 * New node file
 */

var aggr = require('../../index');

var Aggregator = aggr.aggregator;

var r = new Aggregator(1000,100,{
		protocol: aggr.protocol,
		fallback: aggr.fallback('/tmp'),
		name: 'AggregatorPass'
});

var net = aggr.net;
var protocol = aggr.protocol;
var winston = require('winston');

var logger = new (winston.Logger)({
	transports: [new (winston.transports.Console)()]
});

net.socket({
	aggregator: r,
	protocol: protocol,
	fallback: aggr.fallback('/tmp'),
	logger: logger,
	name: 'SocketPass'
}).listen(1337,'127.0.0.1');

net.server({
	aggregator: r,
	protocol: protocol,
	name: 'ServerPass'
}).listen(1338, '127.0.0.1');