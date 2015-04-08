/**
 * New node file
 */

var extend = require('extend');

describe("Protocol Test", function() {
	
	var protocol = require('../lib/protocol.js');
	
	var message = {
		i: 1000, 
		d: {
			id1: {
				key1: 10,
				key2: 20
			},
			id2: {
				key10: 22,
				key20: 25
			}
		}
	}
	
	it('should encode message correctly', function(done) {
		
		var expected = {"1000 id1 key1:10,key2:20": 1, "1000 id2 key10:22,key20:25": 1};
		
		protocol.encode(message, function(encoded) {
			if(expected[encoded]) {
				delete expected[encoded];
			} else {
				done('Unexpected encoding output');
			}
			if(Object.keys(expected).length == 0) {
				done();
			}
		})
	});
	
	it('should decode message correctly', function(done) {
		var p = extend(true, message);
		protocol.encode(p, function(encoded) {
			protocol.decode(encoded, function(err, id, stamp, key, value) {
				if(err) {
					done(err);
				}
				if(p.i != stamp) {
					done('Failed to match timestamp');
				}
				
				if(!p.d[id][key]) {
					done('Failed to find key');
				}
				
				if(p.d[id][key] != value) {
					done('Failed to find key');
				}
				delete p.d[id][key];
				if(Object.keys(p.d[id]).length == 0) {
					delete p.d[id];
				}
				if(Object.keys(p.d) == 0) {
					done();
				}
			});
		});
	});
	
})