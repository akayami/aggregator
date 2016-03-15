'use strict';

var eventEmitter = require('events');

var aggregator = function(reduction, flushDelay, options) {

	if(!options.protocol || typeof(options.protocol) != 'object') {
		throw new Error('Protocol of type object must be provided');
	}
	if(!options.fallback || typeof(options.fallback) != 'object') {
		throw new Error('Fallback of type object must be provided');
	}
	if(!options.name || typeof(options.name) != 'string') {
		throw new Error('Name of type string must be provided');
	}

	var logger = (options.logger ? options.logger: console);

	if(reduction == undefined) {
		reduction = 10000;
	}

	if(flushDelay == undefined) {
		flushDelay = reduction * 2;
	}

	this.buffer = {};
	this.wStream = {};

	this.start = function(){
		options.fallback.upload(options.name, function(file,stream){
			stream.on('data', function(line) {
				line = line.toString().split('\n')[0];
				options.protocol.decode(line, function(err, id, stamp, key, value) {
					this.ingest(id, stamp, key, value);
				}.bind(this))
			}.bind(this));

			stream.on('end', function() {
				options.fallback.empty(file);
				logger.info('Remove after upload end event',file)
			});
		}.bind(this));
	}
	this.start()

	this.ingest = function(id, stamp, key, value) {
		var r = Math.round(stamp / reduction) * reduction;
		this.backup(r, id, stamp, key, value);

		if(!this.buffer[r]) {
			this.buffer[r] = {
				d: {},
				p: undefined
			};
		}
		if(!this.buffer[r].d[id]) {
			this.buffer[r].d[id] = {};
		}
		if(!this.buffer[r].d[id][key]) {
			this.buffer[r].d[id][key] = Number(value);
		} else {
			this.buffer[r].d[id][key] += Number(value);
		}
		clearTimeout(this.buffer[r].p);
		this.buffer[r].p = setTimeout(function() {
			this.parent.emit('data', {i: this.index, d: this.buffer[this.index].d});
			this.parent.wStream[this.index].end();
			delete this.parent.wStream[this.index];
			options.fallback.empty(options.name+'_'+this.index);
			logger.info('rm backup file and close stream after aggregation is done',this.index);
			delete this.buffer[this.index];
		}.bind({buffer: this.buffer, index: r, parent: this}), flushDelay)
	};

	this.backup = function(timeSlot, id, stamp, key, value){
		if(!this.wStream[timeSlot]){
			options.fallback.listener(options.name+'_'+timeSlot,function(stream){
				this.wStream[timeSlot] = stream;
			}.bind(this))
		}
		options.protocol.encodeMsg(id, stamp, key, value, function(encoded) {
			this.wStream[timeSlot].write(encoded + "\n");
		}.bind(this))
	}

	this.stop = function(){
		Object.keys(this.buffer).forEach(function(timeSlot) {
			clearTimeout(this.buffer[timeSlot].p);
			logger.info('Timeslot '+timeSlot+' cleaned due to SIGTERM event')
		}.bind(this))
	}

	process.on('SIGTERM', this.stop.bind(this));
}

aggregator.prototype.__proto__ = eventEmitter.EventEmitter.prototype;

module.exports = aggregator;