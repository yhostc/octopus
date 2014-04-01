var fs = require('fs');
var jsdom = require('jsdom');
var pack = require('../package.json');

var octopus = function (opts) {

	// Default Options
	var options = {
		timeout: 60000,
		jQuery: true,
		maxConnections: 10,
		priorityRange: 10,
		priority: 5,
		retries: 3,
		forceUTF8: false,
		userAgent: packe.name + '/' + pack.version,
		autoWindowClose: true,
		retryTimeout: 10000,
		method: "GET",
		cache: false, //false,true, [ttl?]
		skipDuplicates: false,
		onDrain: false
	};
};