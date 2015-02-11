/**
 * New node file
 */

var eventEmitter = require('events');
var fs = require('fs');

var file = '/tmp/test.txt';


function cleanUp(done) {
	fs.exists(file, function(exist) {
		if(exist) {
			fs.unlink(file, function(err) {
				if(err) {
					done(err);
				} else {
					done();
				}
			});
		} else {
			done();
		}
	})
}

describe("Fallback", function() {
	
	after(function(done) {
		cleanUp(done);
	});
			
	it('should caputre the data event', function(done) {
		var emitterStub = function() {
			
		}
		
		emitterStub.prototype.__proto__ = eventEmitter.EventEmitter.prototype;	
		emitter = new emitterStub();
		
		var fallback = require('../lib/fallback.js')(file, function(data) {
			if(data == 'test\n') {				
				cleanUp(done);
			} else {
				done('Did not recive test message');
			}
		});
		emitter.on('data', fallback.listener);
		emitter.emit('data', "test\n");
	});
	
	it('should read fallback buffer', function(done) {
		var emitterStub = function() {
			
		}
		
		emitterStub.prototype.__proto__ = eventEmitter.EventEmitter.prototype;	
		emitter = new emitterStub();
		
		var fallback = require('../lib/fallback.js')(file, function(data) {
			if(data == 'test\n') {
				fallback.flush(function(stream) {
					stream.on('data', function(line) {
						if(line.length > 0) {
							if(line == 'test') {
								cleanUp(done);
							} else {
								done(new Error('Incorrect data sent' + line));
							}
						}
					})
				})				
			} else {
				done('Did not recive test message');
			}
		});
		emitter.on('data', fallback.listener);
		emitter.emit('data', "test\n");
	});
	
	it('should cleanup after itself', function(done) {
		var emitterStub = function() {
			
		}
		
		emitterStub.prototype.__proto__ = eventEmitter.EventEmitter.prototype;	
		emitter = new emitterStub();
		
		var fallback = require('../lib/fallback.js')(file, function(data) {
			if(data == 'test\n') {
				fallback.flush(function(stream) {
					stream.on('data', function(line) {
						// Not tested here
					});
					
					stream.on('end', function() {
						fallback.empty(function(err) {
							if(err) done(err);
							done();
						});
					})
				})				
			} else {
				done('Did not recive test message');
			}
		});
		emitter.on('data', fallback.listener);
		emitter.emit('data', "test\n");
	})
	
})