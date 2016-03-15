/**
 * New node file
 */

// var mysql = require('mysql-cluster')({
// 	cluster: {
// 		canRetry : true,
// 		removeNodeErrorCount : 5,
// 		defaultSelector : 'RR'
// 	},
// 	global: {
// 		host: 'localhost',
// 		user: 'root',
// 		password: '',
// 		database: 'data'
// 	},
// 	pools: {
// 		master: {
// 			config: {},
// 			nodes:[{}]
// 		}
// 	}
// });

var aggr = require('../../index');

var Aggregator = aggr.aggregator;

var r = new Aggregator(10000,1000,{
		protocol: aggr.protocol,
		fallback: aggr.fallback('/tmp'),
		name: 'AggregatorEndpoint'
});

r.on('data', function(data) {
	// mysql.master(function(err, conn) {
	// 	if(err) {
	// 		console.log(err);
	// 	} else {
	// 		var index = data.i;
	// 		var buffer = data.d;
	// 		var stamp = new Date(index).toISOString().slice(0, 19).replace('T', ' ');;
	// 		for(var id in buffer) {
	// 			conn.query('INSERT INTO stats (stamp, slug, a, b, c, d, e) VALUES (?, ?, ?, ?, ?, ?, ?)', [stamp, id, buffer[id]['a'], buffer[id]['b'], buffer[id]['c'], buffer[id]['d'], buffer[id]['e']], function(err, result) {
	// 				if(err) {
	// 					console.log(err);
	// 				} else {
	// 					console.log('OK');
	// 				}
	// 			});
	// 		}
	// 	}
	// 	conn.release();
	// })
	console.log(data)
});

var net = aggr.net;
var protocol = aggr.protocol;

net.server({
	aggregator: r,
	protocol: protocol,
	name: 'ServerEndpoint'
}).listen(1337, '127.0.0.1');