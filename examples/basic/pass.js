/**
 * New node file
 */

var aggr = require('../../index');

var Aggregator = aggr.aggregator;

var r = new Aggregator(1000);

var net = aggr.net;
var protocol = aggr.protocol;
net.socket({
	aggregator: r, 
	protocol: protocol
}).listen(1337,'127.0.0.1');

net.server({
	aggregator: r, 
	protocol: protocol,
	name: 'Pass'
}).listen(1338, '127.0.0.1');