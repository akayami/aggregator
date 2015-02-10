/**
 * New node file
 */

var aggr = require('../index');

var Aggregator = aggr.aggregator;
var net = aggr.net;

var n = require('net');
var winston = require('winston');

var logger = new (winston.Logger)({  // Disable debug
	transports: []
});



describe("Netmodule test", function() {
	var port = 8999;
	describe("Server test", function() {
		it("Starting server with no aggregator should throw exception", function(done) {
			try {
				net.server({
					
				});
				done(new Error('Exception not thrown'));
			} catch(e) {
				if(e.message != 'Aggregator of type object must be provided') {
					done(new Error('Wrong Exception message thrown:'+ e.message));
				} else {
					done();
				}
			}
		})
		
		it("Starting server with no protocol should throw exception", function(done) {
			try {
				net.server({
					aggregator: new Aggregator(10000)
				});
				done(new Error('Exception not thrown'));
			} catch(e) {
				if(e.message != 'Protocol of type object must be provided') {
					done(new Error('Wrong Exception message thrown:' + e.message));
				} else {
					done();
				}
			}
		})
		
		it("Starting server with aggregator and protocol should work", function(done) {
			try {
				net.server({
					aggregator: new Aggregator(10000),
					protocol: aggr.protocol
				});
				done();
			} catch(e) {
				done(e);
			}
		});
		
		it("Server should listen on assigned port: " + port, function(done) {
			try {
				var server = net.server({
					aggregator: new Aggregator(10),
					protocol: aggr.protocol
				});
				server.listen(port);
				var client = n.connect({port: port}, function() {
					server.close();
					done();
				});
			} catch(e) {
				done(e);
			}
		});
	})
	
	describe("Socket test", function() {
		
		var port = 8999;
		var aggr = require('../index');
		var Aggregator = aggr.aggregator;
		var r = new Aggregator(100);
		var net = aggr.net;
		
		var fallbackFile = '/tmp/fallback.test.txt';
		it("Should throw exception when aggregator not provided", function(done) {
			try {
				var s = net.socket(
					{						
						protocol: aggr.protocol,
						serverOptions: {},
						fallback: aggr.fallback(fallbackFile)
					}
				);
				done(new Error('Has not thrown exception'));
			} catch(e) {
				if(e.message != 'Aggregator is required') {
					done('Exception thrown with wrong message:' + e.message);
				} else {
					done();
				}
			}

		});
		
		it("Should throw exception when protocol not provided", function(done) {
			try {
				var s = net.socket(
					{	
						aggregator: r, 
						//protocol: aggr.protocol,
						serverOptions: {},
						fallback: aggr.fallback(fallbackFile)
					}
				);
				done('Has not thrown exception');
			} catch(e) {
				if(e.message != 'Protocol is required') {
					done('Exception thrown with wrong message:' + e.message);
				} else {
					done();
				}
			}

		});
		
		it("Should not throw exception when aggregator and protocol are provided", function(done) {
			try {
				var s = net.socket(
					{	
						aggregator: r, 
						protocol: aggr.protocol,
					}
				);
				done();
			} catch(e) {
				if(e.message != 'Protocol is required') {
					done('Exception thrown with wrong message:' + e.message);
				} else {
					done();
				}
			}

		});
		
		it("Should start when properly configured", function(done) {
			try {
				var s = net.socket(
					{
						aggregator: r, 
						protocol: aggr.protocol,
						serverOptions: {},
						fallback: aggr.fallback(fallbackFile)
					}
				);
				done();
			} catch(e) {
				done(e);
			}

		});
		
		it("Should listen on assigned port", function(done) {
			try {
				var server = net.server({
					aggregator: new Aggregator(10),
					protocol: aggr.protocol
				});
				server.listen(port);
					
				var s = net.socket(
					{
						aggregator: r, 
						protocol: aggr.protocol,
						serverOptions: {},
						fallback: aggr.fallback(fallbackFile),
						logger: logger
					}
				);
				s.on('connect', function() {
					done();
				})
				s.listen(port);

			} catch(e) {
				done(e);
			}

		});
	})
})