'use strict';


module.exports = {
	encode: function(data, cb) {
		for(var id in data.d) {
			var keys = [];
			for(var key in data.d[id]) {
				keys.push(key + ':' + data.d[id][key])
			}
			var parts = [data.i, id, keys.join(",")];
			cb(parts.join(" "));
		}
	},

	decode: function(message, cb) {
		var p = message.split(" ");
		if(p.length === 3) {
			var d = p[2].split(",");
			for(var x = 0; x < d.length; x++) {
				var kv = d[x].split(":");
				cb(null, p[1], p[0], kv[0], kv[1]);
			}
		} else {
			cb(new Error('Invalid Message Structure'), message);
		}
	},
	
	decode2: function(buffer, cb) {
		var msg = buffer.toString().split("\n");
		for(var i = 0; i < msg.length; i++) {
			if(String(msg[i]).length) {
				var p = msg[i].split(" ");
				var d = p[2].split(",");
				for(var x = 0; x < d.length; x++) {
					var kv = d[x].split(":");
					cb(p[1], p[0], kv[0], kv[1]);
				}
			}
		}
	}
}