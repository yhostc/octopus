var url2 = require('url'),
	util = require('util'),
	events = require('events'),
	queue = require('./lib/queue.js'),
	request = require('request').defaults({
		jar: true
	}),
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
	// cookie
	this._last_cookie = true;

	// initialization
	this.initialization(task);
};
util.inherits(octopus, events.EventEmitter);


octopus.prototype.initialization = function (task) {
	// merge detault options
	this.mergeOptions(task.options || {});
	// start request after queue
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
		idleTime: 500,
		maxConnections: 10,
		userAgent: packages.name + '/' + packages.version
	};

	// Mix Options
	for (i in opts) {
		options[i] = opts[i];
	}

	if (options['redis']) {
		this._redis = new queue.Storage(options['redis'], options['debug']);
	}
};

/**
 * add an queue
 * @public
 * @param  {String|Array} urls
 * @return {[type]}
 */
octopus.prototype.queue = function (urls) {
	this._redis.pushQueue(urls);
	this.emit('queue', urls);
};

/**
 * Next Queue
 * @return {Function} [description]
 */
octopus.prototype.next = function () {
	var that = this;
	// check connection batch numbers
	if (this._queue_loading >= this.options.maxConnections) {
		this.debug('-> next, rather than maxConnections, skip');
		return;
	}

	// check idle time;
	var time = +new Date();
	if ((time - this._request_last) < this.options['idleTime']) {
		setTimeout(function () {
			that.next();
		}, this.options['idleTime']);
		return;
	}
	this._request_last = time;

	// count
	that._queue_loading++;
	// get one Queue
	var c = this._redis;
	c.popQueue(function (err, url) {
		if (url) { // check cache exists
			c.hgetCache(url, function (err2, body) {
				// no cached, requesting
				if (!body) {
					that.debug('-> send an request, url:' + url);
					// send an request
					that._sending(url);
				} else {
					// have cache, skip
					that.debug('-> have cache, skip, url:' + url);

					that._queue_loading--;
					that.next();
				}
			});
		} else {
			that.debug('-> no url queue, subtract queue');
			that._queue_loading--;
			that.next();
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
		jar: that._last_cookie,
		timeout: this.options['timeout'],
		headers: {
			'User-Agent': this.options['userAgent'],
			'Referer': url,
			'Accept': 'text/html,application/xhtml+xml,application/xml;'
		}
	}, function (err, res, body) {
		// adding cache
		that.debug('-> adding cache, url:' + url);

		that._redis.hsetCache(url, body || err);

		// error handing
		if (!err && res && res.statusCode == 200) {
			// if (res.headers && res.headers['set-cookie']) {
			// 	// write cookie
			// 	var k = request.jar();
			// 	res.headers['set-cookie'].forEach(function (c, idx) {
			// 		k.setCookie(c, url);
			// 	});
			// 	that._cookie = k;
			// }

			// complete, jsdom
			that._cheerio(url, body);
		} else {
			that.debug('-> request error, url:' + url);

			that._queue_loading--;
			that.emit('errors', {
				errors: err,
				statusCode: (res && res.statusCode ? res.statusCode : 0)
			});
			that.next();
		}
		res = null;
		body = null;
	})
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
};


octopus.prototype.debug = function (msg) {
	this.options.debug && console.log(msg);
};

exports.Claw = octopus;