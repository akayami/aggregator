'use strict';
/**
 * New node file
 */

var fs = require('fs');
var byline = require('byline');

module.exports = function(file, cb) {
	
	return {
		listener: function(data) {
			fs.appendFile(file, data, function(err) {
				if(err) {
					console.log(err);
				}
				if(cb) {
					cb(data);
				}
			}); 
		},
		flush: function(cb) {
			fs.exists(file, function(exist) {
				if(exist) {
					cb(byline(fs.createReadStream(file)));
				}
			})
		},
		
		empty: function(cb) {
			fs.exists(file, function(exist) {
				if(exist) {
					fs.unlink(file, function(err) {
						if(err) {
							cb(err);
						} else {
							cb();
						}
					});
				}
			})
		}
	}
	
}