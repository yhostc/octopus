var fs = require('fs')
  ,	util = require('util')
  , events = require('events')
  , jsdom = require('jsdom')
  , pack = require('../package.json');

/**
 * An website spider framework for nodejs, directional depth crawling
 * @param  {[Object]} opts
 * @return {[type]}
 */
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

util.inherits(octopus, events.EventEmitter)