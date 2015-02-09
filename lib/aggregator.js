'use strict';

var eventEmitter = require('events');

var aggregator = function(reduction, flushDelay) {
	
	if(reduction == undefined) {
		reduction = 10000;
	}
	
	if(!flushDelay) {
		flushDelay = reduction * 2;
	}
	
	this.buffer = {};
	
	this.ingest = function(id, stamp, key, value) {
		var r = Math.round(stamp / reduction) * reduction;
		
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
			delete this.buffer[this.index];
		}.bind({buffer: this.buffer, index: r, parent: this}), flushDelay)
	};
}

aggregator.prototype.__proto__ = eventEmitter.EventEmitter.prototype;

module.exports = aggregator;