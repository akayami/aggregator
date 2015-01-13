'use strict';
/**
 * New node file
 */
var reconnect = require('reconnect-net');
var net = require('net');

module.exports = {
		
	socket: function(options) {
		
		if(!options.aggregator) {
			throw new Error('Aggregator is required');
		}
		if(!options.protocol) {
			throw new Error('Protocol is required');
		}
		
		var aggregator = options.aggregator;
		var protocol = options.protocol;
		var serverOptions = (options.serverOptions && typeof(options.serverOptions) == 'object' ? options.serverOptions : {});
		var plug = (options.plug && typeof(options.plug) == 'function' ? options.plug : function() {});  
		
		return reconnect(serverOptions, function(stream) {	
			stream.on('data', function(data) {
				console.log('Received : ' + data.toString());
			});
		}).on('connect', function(con) {
			//console.log('conn');
			plug = function(data) {
				protocol.encode(data, function(encoded) {
					con.write(encoded);
				});
			}
			aggregator.on('data', plug);
		}).on('reconnect', function(n, delay) {
			console.log('re-conn');
		}).on('disconnect', function(err) {
			console.log('disco');
			aggregator.removeListener('data', plug);
		}); 
	},	
	server: function(options) {//Aggregator, protocol) {
		if(!options.aggregator || typeof(options.aggregator) != 'object') {
			throw new Error('Aggregator of type object must be provided');
		}		
		if(!options.protocol || typeof(options.protocol) != 'object') {
			throw new Error('Protocol of type object must be provided');
		}
		var aggregator = options.aggregator;
		var protocol = options.protocol;
		var name = (options.name ? options.name : 'Reducer Net Module Instance');
		return net.createServer(function(socket) {
			socket.write('Echo ' +name+ '\r\n');
			socket.on('data', function(encoded) {
				protocol.decode(encoded, function(id, stamp, key, value) {
					aggregator.ingest(id, stamp, key, value)
				});
			});
			socket.on('error', function(err) {
				console.error(err);
			});
		});
	}
}