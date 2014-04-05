var fs = require('fs'),
	util = require('util'),
	events = require('events'),
	jsdom = require('jsdom'),
	pack = require('package.json'),
	request = require('request');

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

	// 实例
	this._instances = [];
	// 路由
	this._routes = [];
	// 队列
	this._queue = [];


	events.EventEmitter.call(this);
};


octopus.prototype.loads = function (module, options) {
	// 缓存实例
	this._instances.push({
		module: module,
		options: options
	});
	// 初始化爬行此模块
	this.request(options.baseUrl);
};

/**
 * 路由加载处理模块
 * @public
 * @param  {[type]}   regex
 * @param  {Function} callback
 * @return {[type]}
 */
octopus.prototype.get = function (regex, callback) {
	// 缓存路由规则
	this._routes.push({
		regex: regex,
		callback: callback
	});
}

/**
 * 增加爬行轨迹
 * @param  {[type]} link 连接
 * @return {[type]}
 */
octopus.prototype.queue = function (link) {

	// body...
};

octopus.prototype.request = function (first_argument) {
	var that = this;
	request('http://www.google.com', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body) // Print the google web page.
			// 遍历路由，执行对应回调
			that._routes.forEach(route, idx) {

			}
		}
	})
};


util.inherits(octopus, events.EventEmitter);