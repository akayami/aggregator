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
		var socketOption = (options.socketOption && typeof(options.socketOption) == 'object' ? options.socketOption : {});
//		var plug = (options.plug && typeof(options.plug) == 'function' ? options.plug : function() {});
		var chain = (options.chain ? options.chain: undefined);
		var logger = (options.logger ? options.logger: console);
		var plug;
		var connected = false;
		
		var fallbackListener;
		var fallback;
		if(options.fallback) {
			fallback = options.fallback;
			fallbackListener = function(data) {
				protocol.encode(data, function(encoded) {
					options.fallback.listener(encoded);
				});
			}
			aggregator.on('data', fallbackListener);
		} else {
			fallback = undefined;
			fallbackListener = undefined;
		}
		
		return reconnect(socketOption, function(stream) {	
			stream.on('data', function(data) {
				logger.info('Received : ' + data.toString());
			});
		}).on('connect', function(con) {
			logger.info('conn');
			connected = true;
			
			plug = function(data) {
				protocol.encode(data, function(encoded) {
					con.write(encoded);
					if(chain) {
						chain(encoded);
					}
				});
			}
			//aggregator.on('data', plug);
			
			if (fallbackListener) {
				aggregator.removeListener('data', fallbackListener);
				logger.info('Removed Fallback listener');
				fallback.flush(function(stream) {
					stream.on('data', function(line) {
						con.write(line);
					});
					
					stream.on('end', function() {
						fallback.empty(function(err) {
							if(err) {
								logger.error('Failed to remove backup file');
							} else {
								logger.info('Done flushing');
							}
						});
					});
				});
			}
			
			aggregator.on('data', plug);
		}).on('reconnect', function(n, delay) {
			logger.info('re-conn');
		}).on('disconnect', function(err) {
			if(connected) {
				aggregator.removeListener('data', plug);
				if (fallbackListener) {
					aggregator.on('data', fallbackListener);
				}
				logger.info('disco');
			}
			connected = false;
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
				logger.error(err);
			});
		});
	}
}