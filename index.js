var util = require('util'),
	events = require('events'),
	jsdom = require("jsdom"),
	redis = require('./lib/redis.js'),
	http = require('./lib/http.js');

/**
 * An website spider framework for nodejs, directional depth crawling
 * @param  {[Object]} opts
 * @return {[type]}
 */
function octopus(task) {
	events.EventEmitter.call(this);
	// task
	this._task = task;
	// queue batch index and err number
	this._queue_err = 0;
	this._queue_loading = 0;
	// initialization
	this.initialization(task);
};
util.inherits(octopus, events.EventEmitter);


octopus.prototype.initialization = function (task) {
	// init http
	this._http = new http.Request();
	// merge detault options
	this.options = this._http.options(task.options || {});
	if (this.options['redis']) {
		this._redis = new redis.Storage();
	}
	// start request
	this.on('queue', this.next);
	// save queue
	task.queue && this.queue(task.queue);
};

/**
 * add an queue
 * @public
 * @param  {String|Array} urls
 * @return {[type]}
 */
octopus.prototype.queue = function (urls) {
	if (typeof urls === 'string') {
		urls = [urls];
	}
	if (urls instanceof Array) {
		var that = this;
		urls.forEach(function (url) {
			that._redis.pushQueue(url);
			that.emit('queue', url);
		});
	}
};

/**
 * Next Queue
 * @return {Function} [description]
 */
octopus.prototype.next = function (url) {
	var that = this;
	var c = this._redis;

	// check connection batch numbers
	if (this._queue_loading >= this.options['maxConnections']) {
		return;
	}

	this._queue_loading++;

	// get one Queue
	c.popQueue(function (err, url) {
		if (url) { // check cache exists
			c.hgetCache(url, function (err2, body) {
				if (body) {
					// parse html dom, from cache
					that._jsdom(url, body);
				} else {
					// send an request
					that._sending(url);
				}
			});
		} else if (!that._queue_loading) { // next
			that.emit('complete', 'All is ok!')
		}
	});
};


octopus.prototype._sending = function (url) {
	var that = this;
	var http = this._http;

	// count & events
	this._queue_batch++;


	// send an request
	http.request(url, function (errors, response, body) {
		// error handing
		if (errors) {
			that._errors(errors);
			return;
		}
		// complete, jsdom
		that._jsdom(url, body);
	});
};


octopus.prototype._jsdom = function (url, body) {
	// complete, jsdom
	var that = this;
	var config = {
		html: body,
		scripts: this.options['scripts'],
		done: function (errors, window) {
			that.emit('fetch', url);
			if (window) {
				window.url = url;
				that.emit('queue');
				that._fetch(errors, window, body);
			} else {
				that._errors(errors);
			}
		}
	};
	jsdom.env(config);
};
// cache
// this._cache.hset(one.url, 'body', body);
octopus.prototype._fetch = function (errors, window, body) {
	var callback = this._task.options['callback'] || function () {};
	// result for global callback
	callback(errors, window);

	if (!errors) {
		// foreach routes
		this._task.route.forEach(function (route) {
			if (window.url.match(route.regex)) {
				route.callback(window);
			}
		});
	}

	this._queue_loading--;

	// for complete
	var that = this;
	this._redis.lenQueue(function (err, len) {
		// for next
		if (that._queue_loading <= 0 && len <= 0) {
			that.emit('->complete', 'All is ok!')
		}
		that.options['debug'] && console.log('total:', len, ', loading:', that._queue_loading);
	});
};

octopus.prototype._errors = function (errors) {
	this._queue_loading--;
	this.emit('faild', errors);
	this.emit('queue');
};


exports.Claw = octopus;