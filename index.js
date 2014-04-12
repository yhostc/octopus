var util = require('util'),
	events = require('events'),
	redis = require('./lib/redis.js'),
	request = require('request'),
	cheerio = require('cheerio'),
	packages = require('./package.json');

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
	this._request_last = 0;
	// initialization
	this.initialization(task);
};
util.inherits(octopus, events.EventEmitter);


octopus.prototype.initialization = function (task) {
	// merge detault options
	this.mergeOptions(task.options || {});
	// start request
	this.on('queue', this.next);
	// save queue
	task.queue && this.queue(task.queue);
};

octopus.prototype.mergeOptions = function (opts) {
	// Default Options
	var options = this.options = {
		debug: false,
		redis: true,
		timeout: 60000,
		idleTime: 3000,
		maxConnections: 10,
		userAgent: packages.name + '/' + packages.version
	};
	// Mix Options
	for (i in opts) {
		options[i] = opts[i];
	}

	if (options['redis']) {
		this._redis = new redis.Storage(options['redis']);
	}
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
octopus.prototype.next = function () {
	this.options.debug && console.log('-> nexting');

	var that = this;
	var c = this._redis;
	// check connection batch numbers
	if (this._queue_loading >= this.options.maxConnections) {
		this.options.debug && console.log('-> next, rather than maxConnections, skip');
		return;
	}

	// check idle time;
	var time = +new Date();
	if ((time - this._request_last) < this.options['idleTime']) {
		setTimeout(function () {
			that.next()
		}, this.options['idleTime']);
		return;
	}
	this._request_last = time;

	// count
	that._queue_loading++;
	// get one Queue
	c.popQueue(function (err, url) {
		that.options.debug && console.log('-> get an queue, err:', err);
		if (url) { // check cache exists
			c.hgetCache(url, function (err2, body) {
				that.options.debug && console.log('-> check cache for url, err:', err2);
				// no cached, requesting
				if (!body) {
					that.options.debug && console.log('-> send an request, url:', url);
					// send an request
					that._sending(url);
				} else {
					// have cache, skip
					that.options.debug && console.log('-> have cache, skip, url:', url);

					that._queue_loading--;
					that.next();
				}
			});
		} else {
			that.options.debug && console.log('-> no url queue, subtract queue');
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

	request({
		url: url,
		jar: true,
		timeout: this.options['timeout'],
		headers: {
			'User-Agent': this.options['userAgent']
		},
		maxRedirects: this.options['maxRedirects']
	}, function (errors, response, body) {
		that.options.debug && console.log('-> requested, statusCode:', response.statusCode);
		if (!errors && response.statusCode == 200) {
			// adding cache
			that.options.debug && console.log('-> adding cache, url:', url);

			that._redis.hsetCache(url, body, function () {
				response = null;
				body = null;
			});

			// complete, jsdom
			that._cheerio(url, body);
		} else {
			that.options.debug && console.log('-> request error, url:', url);

			that._queue_loading--;
			that.emit('errors', {
				errors: errors,
				statusCode: response.statusCode
			});
			that.queue(url);
			that.next();
		}
	});
};

/**
 * parse html dom
 * @param  {[type]} url
 * @param  {[type]} body
 * @return {[type]}
 */
octopus.prototype._cheerio = function (url, body) {
	var $ = cheerio.load(body);
	$.url = url;

	this._queue_loading--;
	this.options.debug && console.log('-> cheerio ok, url:', url);

	// for global callback
	(this._task.options['callback'] || function () {})($);

	// for route callback
	this._task.route.forEach(function (route) {
		if (url.match(route.regex)) {
			route.callback($);
		}
	});

	// end of
	var that = this;
	this._redis.lenQueue(function (err, len) {
		that.options.debug && console.log('-> get len queue, errors:', err);

		err && that.emit('errors', err);
		// for next
		if (that._queue_loading <= 0 && len <= 0) {
			that.emit('complete', 'All is ok!')
		} else {
			that.emit('fetch', {
				url: url,
				remain: len,
				loading: that._queue_loading
			});
			that.next();
		}
	});



	/*
	var that = this;
	var config = {
		html: body,
		scripts: this.options['scripts'],
		done: function (errors, window) {

			that._queue_loading--;
			if (errors && !window) {
				that.options.debug && console.log('-> cheerio the html, errors:', errors);

				that.emit('errors', errors);
				that.queue(url);
				that.next();
			} else {
				that.options.debug && console.log('-> cheerio ok, url:', url);


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
					that.options.debug && console.log('-> get len queue, errors:', err);

					err && that.emit('errors', err);
					// for next
					if (that._queue_loading <= 0 && len <= 0) {
						that.emit('complete', 'All is ok!')
					} else {
						that.emit('fetch', {
							url: url,
							remain: len,
							loading: that._queue_loading
						});
						that.next();
					}
				});
			}
		}
	};
	jsdom.env(config);
	// for next request
	this.next();
	*/
};

exports.Claw = octopus;