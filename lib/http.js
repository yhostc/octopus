var util = require('util'),
	events = require('events'),
	request = require('request'),
	packages = require('../package.json');


function http(config) {
	events.EventEmitter.call(this);



}
util.inherits(http, events.EventEmitter);

http.prototype.options = function (opts) {
	// Default Options
	var options = this._options = {
		debug: true,
		redis: true,
		timeout: 60000,
		scripts: [],
		maxRedirects: 10,
		maxConnections: 10,
		userAgent: packages.name + '/' + packages.version
	};
	// Mix Options
	for (i in opts) {
		options[i] = opts[i];
	}
	return options;
};


http.prototype.request = function (url, callback) {
	request({
		url: url,
		timeout: this._options['timeout'],
		headers: {
			'User-Agent': this._options['userAgent']
		},
		maxRedirects: this._options['maxRedirects']
	}, function (errors, response, body) {
		callback(errors, response, body);
	});
};



exports.Request = http;