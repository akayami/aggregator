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
					options.fallback.listener(encoded + "\n");
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
			
			function write(line) {
				con.write(line + "\n");
				if(chain) {
					chain(line + "\n");
				}
			}
			
			logger.info('conn');
			connected = true;
			
			plug = function(data) {
				protocol.encode(data, function(encoded) {
					write(encoded);
				});
			}
			//aggregator.on('data', plug);
			
			if (fallbackListener) {
				aggregator.removeListener('data', fallbackListener);
				logger.info('Removed Fallback listener');
				fallback.flush(function(stream) {
					stream.on('data', function(line) {
						write(line);
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
			var chunk = null;
			socket.write('Echo ' +name+ '\r\n');
			socket.on('data', function(encoded) {
				// If there is a chunk in memory, prepend it
				if(chunk != null) {
					encoded = chunk + encoded;
					chunk = null;
				}
				var msgs = encoded.toString().split('\n');	// Split resulting message
				if(msgs.length === 1) { // The whole message has no new lines. Storing in chunk until we get a full one.
					chunk = chunk + msgs[0];
				} else {
					var last = msgs.pop();
					if(last.length != 0) {
						chunk = last;
					}
					for(var x = 0; x < msgs.length; x++) {
						protocol.decode(msgs[x], function(err, id, stamp, key, value) {
							if(err) {
								console.error(err);
								console.error(id);
							} else {
								aggregator.ingest(id, stamp, key, value)
							}
						});
					}
				}
			});
			socket.on('error', function(err) {
				logger.error(err);
			});
		});
	}
}