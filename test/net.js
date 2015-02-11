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



describe("Netmodule", function() {
	var port = 8999;
	describe("Server", function() {
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
	
	describe("Socket", function() {
		
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
						fallback: aggr.fallback(fallbackFile),
						logger: logger
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
						fallback: aggr.fallback(fallbackFile),
						logger: logger
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
						logger: logger
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
						fallback: aggr.fallback(fallbackFile),
						logger: logger
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
					server.close();
					s.disconnect();
					//console.log(s);

				})
				s.listen(port);

			} catch(e) {
				done(e);
			}

		});
	});
	
	describe("Combined", function() {		
		it("Should receive aggregated message", function(done) {
			try {
				var net = aggr.net;
				var protocol = aggr.protocol;
				
				var serverAggr = new Aggregator(10);
				serverAggr.on('data', function(data) {
					if(typeof data == 'object') {
						if(data.i != 1000) {
							done('No time interval recieved' + data.i);
							return;
						}
						if(!data.d || !data.d.test || !data.d.test.A) {
							done('Wrong data received - Mismatched object structure');
							return;
						}
						
						if(data.d.test.A != 5) {
							done('Wrong data received - Bad Value: ' + data.d.test.A);
							return;
						}
						done();
					}
				});
				
				net.server({
					aggregator: serverAggr, 
					protocol: protocol,					
				}).listen(port);
				
				var r = new Aggregator(1);
				
				var s = net.socket({
					aggregator: r, 
					protocol: protocol,
					logger: logger
				});
				s.on('connect', function() {
					r.ingest('test', 1000, 'A', 5);
				});
				s.listen(port);
				
			} catch (e) {
				done(e);
			}
		})
	})
})