'use strict';
/**
 * New node file
 */
var reconnect = require('reconnect-net');
var net = require('net');

module.exports = {

	socket: function(options) {

		if (!options.aggregator) {
			throw new Error('Aggregator is required');
		}
		if (!options.protocol) {
			throw new Error('Protocol is required');
		}

		var aggregator = options.aggregator;
		var protocol = options.protocol;
		var socketOption = (options.socketOption && typeof(options.socketOption) == 'object' ? options.socketOption : {});
		//		var plug = (options.plug && typeof(options.plug) == 'function' ? options.plug : function() {});
		var chain = (options.chain ? options.chain : undefined);
		var logger = (options.logger ? options.logger : console);
		var plug;
		var connected = false;
		var handshake = false;

		var fallbackListenerAttached = false;
		var fallbackListener;
		var fallback;
		var fallbackFlushPosition = 0;

		var write;

		if (options.fallback) {
			fallback = options.fallback;
			fallbackListener = function(data) {
				protocol.encode(data, function(encoded) {
					options.fallback.listener(encoded + "\n");
				});
			};
			aggregator.on('data', fallbackListener);
			console.log('Fallback setup');
		} else {
			fallback = undefined;
			fallbackListener = undefined;
		}

		return reconnect(socketOption, function(stream) {
			stream.on('data', function(data) {
				var msgs = String(data.toString()).split('\n');
				for (var x = 0; x < msgs.length; x++) {
					var msg = msgs[x];
					if (msg === "HELO") {
						logger.info('Handshake Received: ' + msg);
						handshake = true;
						if (fallbackListener) {
							aggregator.removeListener('data', fallbackListener);
							fallbackListenerAttached = false;
							logger.info('Removed Fallback listener');
							fallback.flush(function(stream) {
								console.log('Flushing... Last flush position: ' + fallbackFlushPosition);
								// Tracks the position of this flush
								// fallbackFlushPosition should normally match c, unless connection was lost while flushing
								// In that case, flushing should be restated from last fluhsed line.
								var c = 0;
								stream.on('data', function(line) {
									if (c >= fallbackFlushPosition) {
										if (!connected) {
											if (stream._failed !== true) {
												console.warn('Connection lost while flushing, trying to recover');
											}
											stream._failed = true;
											return false; // Bail out, connection lost
										}
										write(line);
										fallbackFlushPosition++;
									}
									c++;
								});

								stream.on('end', function() {
									if (stream._failed !== true) {
										fallback.empty(function(err) {
											if (err) {
												logger.error('Failed to remove backup file');
											} else {
												logger.info('Done flushing from fallback buffer: ' + c + ' lines ');
											}
											fallbackFlushPosition = 0;
										});
									} else {
										console.log('Will not delete fallback buffer as we failed to push all data. Will retry next time from last position.');
									}
								});
							});
						}
						aggregator.on('data', plug);
					} else {
						if (msg.length) {
							logger.info('Received : ' + msg);
						}
					}
				}
			});
		}).on('connect', function(con) {

			write = function(line) {
				con.write(line + "\n");
				if (chain) {
					chain(line + "\n");
				}
			};

			logger.warn('conn');
			connected = true;

			plug = function(data) {
				protocol.encode(data, function(encoded) {
					write(encoded);
					if (options.debug) logger.info('Sending => %s', encoded);
				});
			}

		}).on('reconnect', function(n, delay) {
			logger.warn('re-conn');
		}).on('disconnect', function(err) {
			if (connected) {
				connected = false;
				aggregator.removeListener('data', plug);
				logger.info('Disconnection');
				if (fallbackListener && !fallbackListenerAttached) {
					logger.info('Fallback Attached');
					aggregator.on('data', fallbackListener);
					fallbackListenerAttached = true;
				} else if (fallbackListener && fallbackListenerAttached) {
					logger.info('Disconnection while trying to empty fallback buffer');
					aggregator.removeListener('data', fallbackListener);
					fallbackListenerAttached = false;
				}
			}
			handshake = false;
		});
	},
	server: function(options) { //Aggregator, protocol) {

		if (!options.aggregator || typeof(options.aggregator) != 'object') {
			throw new Error('Aggregator of type object must be provided');
		}
		if (!options.protocol || typeof(options.protocol) != 'object') {
			throw new Error('Protocol of type object must be provided');
		}

		var aggregator = options.aggregator;
		var protocol = options.protocol;
		var name = (options.name ? options.name : 'Reducer Net Module Instance');
		var logger = (options.logger ? options.logger : console);

		return net.createServer(function(socket) {
			var chunk = null;
			socket.write('HELO\n');
			socket.write('Echo ' + name + '\n');
			socket.on('data', function(encoded) {
				// If there is a chunk in memory, prepend it
				if (chunk != null) {
					encoded = chunk + encoded;
					chunk = null;
				}
				var msgs = encoded.toString().split('\n'); // Split resulting message
				if (msgs.length === 1) { // The whole message has no new lines. Storing in chunk until we get a full one.
					chunk = chunk + msgs[0];
				} else {
					var last = msgs.pop();
					if (last.length != 0) {
						chunk = last;
					}
					for (var x = 0; x < msgs.length; x++) {
						protocol.decode(msgs[x], function(err, id, stamp, key, value) {
							if (err) {
								logger.error(err);
								logger.error(id);
							} else {
								aggregator.ingest(id, stamp, key, value);
								if (options.debug) logger.info('Ingesting => id [%s] stamp [%d] key [%s] value [%d]', id, stamp, key, value);
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
};
