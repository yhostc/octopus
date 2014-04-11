var util = require('util'),
	events = require('events'),
	jsdom = require("jsdom"),
	redis = require('./lib/redis.js'),
	http = require('./lib/http.js');

/**
 * An website spider framework for nodejs, directional depth crawling
 * @param  {Object} opts
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
		this._redis = new redis.Storage(this.options['redis']);
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
	// count
	that._queue_loading++;
	// get one Queue
	c.popQueue(function (err, url) {
		if (url) { // check cache exists
			c.hgetCache(url, function (err2, body) {
				if (!body) {
					// send an request
					that._sending(url);
				}
			});
		} else {
			that._queue_loading--;
		}
	});
};

/**
 * sending an request
 * @param  {String} url
 * @return {[type]}
 */
octopus.prototype._sending = function (url) {
	var that = this;
	var http = this._http;

	// send an request
	http.request(url, function (errors, response, body) {
		// error handing
		if (errors) {
			that._queue_loading--;
			that.emit('errors', errors);
			that.queue(url);
			that.next();
		} else {
			// adding cache
			that._redis.hsetCache(url, body, function () {
				response = null;
				body = null;
			});

			// complete, jsdom
			that._jsdom(url, body);
		}
	});
};

/**
 * parse html dom
 * @param  {[type]} url
 * @param  {[type]} body
 * @return {[type]}
 */
octopus.prototype._jsdom = function (url, body) {
	// complete, jsdom
	var that = this;
	var config = {
		html: body,
		scripts: this.options['scripts'],
		done: function (errors, window) {
			that._queue_loading--;
			if (errors && !window) {
				that.emit('errors', errors);
				that.queue(url);
				that.next();
			} else {
				window.url = url;
				// for global callback
				(that._task.options['callback'] || function () {})(errors, window);
				// for route callback
				that._task.route.forEach(function (route) {
					if (window.url.match(route.regex)) {
						route.callback(window);
					}
				});
				// end of
				that._redis.lenQueue(function (err, len) {
					err && that.emit('errors', err);
					// for next
					if (that._queue_loading <= 0 && len <= 0) {
						that.emit('complete', 'All is ok!')
					}
					that.emit('fetch', {
						url: url,
						remain: len,
						loading: that._queue_loading
					});
					that.next();
				});
				window.close();
				window = null;
			}
		}
	};
	jsdom.env(config);
	// for next request
	this.next();
};

exports.Claw = octopus;