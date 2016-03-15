/**
 * New node file
 */

var eventEmitter = require('events');
var fs = require('fs');

var assert = require('assert');
var dir = '/tmp';
var file = 'entrypoint.txt';

function cleanUp(done) {
	fs.exists(dir+'/'+file, function(exist) {
		if(exist) {
			fs.unlink(dir+'/'+file, function(err) {
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
	var fallback = require('../lib/fallback.js')(dir);

	describe("Listener method", function() {
		afterEach(function(done) {
			cleanUp(done);
		});
		it('should return write stream', function(done) {
			fallback.listener(file,function(stream){
				assert.equal(true,stream.writable);
				done()
			});
		})
	})
	describe("Empty method", function() {
		afterEach(function(done) {
			cleanUp(done);
		});
		it('should remove file', function(done) {
			fs.closeSync(fs.openSync(dir+'/'+file, 'w'));
			fallback.empty(file,function(err){
				assert.equal(null,err);
				done()
			});
		})
	})
	describe("Flush method", function() {
		afterEach(function(done) {
			cleanUp(done);
		});
		it('should return read stream and data ,line by line', function(done) {
			var data = 'testData testData';
			fs.appendFileSync(dir + '/'+file, data, 'utf8');
			fallback.flush(file,function(stream){
				assert.equal(true,stream.readable);
				stream.on('data',function(line){
					assert.deepEqual(data,line.toString());
					done();
				})
			});
		})
	})
	describe("Upload method", function() {
		afterEach(function(done) {
			cleanUp(done);
		});
		it('should return read stream and data ,line by line for all files with mask', function(done) {
			var data = 'testData testData';
			var mask = 'testMask';
			fs.appendFileSync(dir + '/'+mask+'_'+file, data, 'utf8');

			fallback.upload(mask,function(fileName,stream){
				assert.equal(mask+'_'+file+'_upload',fileName);
				assert.equal(true,stream.readable);
				stream.on('data',function(line){
					assert.deepEqual(data,line.toString());
					done();
				})
			});
		})
	})
})