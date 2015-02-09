/**
 * New node file
 */
var aggregator = require('../lib/aggregator.js');


describe("Aggregator test", function() {
	
	//id, stamp, key, value
	
	var data = [
		['a', 200, 'key', 1],
		['a', 200, 'key', 1],
		['a', 200, 'key1', 2],
		['a', 200, 'key1', 2],
		
		['a', 250, 'key', 1],
		['a', 250, 'key', 1],	
		['a', 250, 'key1', 3],
		['a', 250, 'key1', 3]
	]
	
	
	it('should aggregate data', function(done) {
		var status = {
			a: false,
			b: false
		}
		var agg = new aggregator(100);
		agg.on('data', function(item) {
			if(!item.d.a) {
				next(new Erorr('Missing name space'));
			}
			switch(item.i) {
				case 200:
					if(item.d.a.key != 2 || item.d.a.key1 != 4) {
						done(new Error('Wrong values returned'));
					}
					status.a = true;
					break;
				case 300:
					if(item.d.a.key != 2 || item.d.a.key1 != 6) {
						done(new Error('Wrong values returned'));
					}
					status.b = true;
					break;
				default:
					done(new Error('Unknown item time'));
					break;
			}
			if(status.a && status.b) {
				done();
			}
		})
		
		for(var x in data) {
			agg.ingest(data[x][0], data[x][1], data[x][2], data[x][3]);
		}
		
	})
})