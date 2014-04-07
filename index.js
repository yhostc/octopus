var util = require('util'),
	events = require('events'),
	packages = require('./package.json');
var request = require('request');
var jsdom = require("jsdom");


/**
 * An website spider framework for nodejs, directional depth crawling
 * @param  {[Object]} opts
 * @return {[type]}
 */
function octopus(task) {
	events.EventEmitter.call(this);

	// instances
	this._task = task;
	// queue
	this._queue = [];
	// cache
	this._cache = {};

	// mix options
	this._options(task);

	// save routes
	this.route(task.route);

	// start request
	var that = this;
	this.on('queue', function () {
		that._request();
	});

	// save queue
	task.queue && this.queue(task.queue);
};
util.inherits(octopus, events.EventEmitter);


octopus.prototype._options = function (task) {
	// Default Options
	this.options = {
		timeout: 60000,
		maxRedirects: 2,
		cache: false,
		userAgent: packages.name + '/' + packages.version
	};
	var sources = task.options;

	// mix options
	src = task.options || {};
	for (i in src) {
		this.options[i] = src[i];
	}
};

/**
 * 路由模块
 * @public
 * @param  {[type]}   regex
 * @param  {Function} callback
 * @return {[type]}
 */
octopus.prototype.route = function (one) {
	if (one instanceof Array) {
		this._routes = one;
	} else if (arguments.length === 2) {
		this._routes = [{
			regex: one,
			callback: arguments[1]
		}];
	} else {
		console.error('invalid route.');
	}
	return this._routes;
}

/**
 * 增加爬行轨迹
 * @public
 * @param  {[type]} link 连接
 * @return {[type]}
 */
octopus.prototype.queue = function (urls) {
	var that = this;
	if (urls instanceof Array) {
		urls.forEach(function (url) { // insert an batch
			that._queue.push(url);
		});
	} else if (typeof urls === 'string') { // insert one 
		that._queue.push(url);
	} else {
		console.error('invalid queue task.');
	}
	this.emit('queue');
	return this._queue;
};


/**
 * 请求一个URL
 * @return {[type]} [description]
 */
octopus.prototype._request = function () {
	var that = this;
	var one = this._queue.pop();

	// check complete
	if (!one) {
		this.emit('complete', 'All is Ok!')
		return;
	}
	// check cache
	if (this._cache[one.url]) {
		this._jsdom(one.url, this._cache[one.url]);
	}


	// request an url
	request({
		url: one.url,
		timeout: this.options['timeout'],
		headers: {
			'User-Agent': this.options['userAgent']
		}
		maxRedirects: this.options['maxRedirects']
	}, function (errors, response, body) {
		// error handing
		if (errors) {
			that.emit('faild', errors);
			return;
		}
		// cache
		that._cache[one.url] = body;

		// complete, jsdom
		that.jsdom(one.url, body);
	});

};

octopus.prototype._jsdom = function (url, body) {
	// complete, jsdom
	var that = this;
	var config = {
		html: body,
		scripts: this.options['scripts'],
		done: function (errors, window) {
			// for callback
			if (window) {
				window.url = url;
				that._fetch(errors, window);
			}
			// 
			if (errors) {
				that.emit('faild', errors);
				that._errors(errors, url);
			}
		}
	};

	jsdom.env(config);

	// for next
	if (this._queue.length > 0) {
		this._request();
	}
};


octopus.prototype._fetch = function (errors, window) {
	var callback = this._options['callback'] || function () {};

	// result for global callback
	callback(errors, window);

	// result for route callback
	this._routes.forEach(function (route) {
		if (window.url.match(route.regex)) {
			route.callback(window);
		}
	});
};


exports.Claw = octopus;