var fs = require('fs'),
	util = require('util'),
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
	// queue batch number
	this._queue_batch = 0;
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
		cache: false,
		timeout: 60000,
		maxRedirects: 2,
		maxConnections: 3,
		scripts: ['http://code.jquery.com/jquery.js'],
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
		that._queue.push(urls);
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
	// check complete
	if (this._queue.length <= 0 || this._queue_batch > this.options['maxConnections']) {
		return;
	}

	var that = this;
	var url = this._queue.pop();

	// check cache
	if (this._cache[url]) {
		this._jsdom(url, this._cache[url]);
		return;
	}

	// count number
	this._queue_batch++;
	this.emit('fetch', url);

	// request an url
	request({
		url: url,
		timeout: this.options['timeout'],
		headers: {
			'User-Agent': this.options['userAgent']
		},
		maxRedirects: this.options['maxRedirects']
	}, function (errors, response, body) {
		// error handing
		if (errors) {
			that._queue_batch--;
			that.emit('faild', errors);
			that._request();
			return;
		}
		// cache
		that._cache[url] = body;

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
			// for callback
			if (window) {
				window.url = url;
				that._fetch(errors, window, body);
			}
			// error handling
			if (errors) {
				that.emit('faild', errors);
			}
		}
	};

	jsdom.env(config);
};


octopus.prototype._fetch = function (errors, window, body) {
	var callback = this._options['callback'] || function () {};

	// result for global callback
	callback(errors, window);

	// result for route callback
	if (window.$) {
		this._routes.forEach(function (route) {
			if (window.url.match(route.regex)) {
				route.callback(window);
			}
		});
	} else {
		console.log('jquery is not loaded!');
		console.log(errors);
		var filename = (window.url.match(/\/category\/(\d+)\/intro\//i))[1];
		fs.writeFileSync(filename + '.html', body);
		//console.log(body);
	}


	// for next
	this._request();

	// for complete
	if (this._queue_batch <= 0 && this._queue.length <= 0) {
		this.emit('complete', 'All is ok!')
	}
	this._queue_batch--;
	console.log(this._queue_batch, this._queue.length);
};
exports.Claw = octopus;