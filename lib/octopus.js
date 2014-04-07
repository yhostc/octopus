var fs = require('fs'),
	util = require('util'),
	events = require('events'),
	extend = require('extend'),
	packages = require('../package.json');

var request = require('request');

/**
 * An website spider framework for nodejs, directional depth crawling
 * @param  {[Object]} opts
 * @return {[type]}
 */
function octopus(mod) {
	events.EventEmitter.call(this);
	// Default Options
	var defaultOptions = {
		method: "GET",
		timeout: 60000,
		jQuery: true,
		retries: 3,
		autoWindowClose: true,
		retryTimeout: 10000,
		cache: false, //false,true
		skipDuplicates: false,
		userAgent: packages.name + '/' + packages.version
	};
	// instances
	this._instances = null;
	// queue
	this._queue = [];

	// check module file
	if (!fs.existsSync(mod)) {
		throw (mod + ' module is not founded!');
	}
	// load module
	var m = this._instances = require(mod);
	// check module options
	if (!m.options) {
		throw ('the moudle ' + file + ' is not found options');
	}
	// checkout module route
	if (!m.route) {
		throw ('the moudle ' + file + ' is not found route function');
	}

	// mix options
	var opts = extend(defaultOptions, m.options);

	console.log(opts);
	// cache instances
	//this._instances[opts.id] = m;

	// route
	//m.route(this);
};
util.inherits(octopus, events.EventEmitter);

/**
 * 路由加载处理模块
 * @public
 * @param  {[type]}   regex
 * @param  {Function} callback
 * @return {[type]}
 */
octopus.prototype.get = function (regex, callback, context) {
	var id = context.options.id;
	var instances = this._instances[id];
	// 缓存路由规则
	// this._routes.push({
	// 	regex: regex,
	// 	callback: callback,
	// 	complete: 0,
	// 	retry: 0,
	// });
	//console.log(regex);
}

/**
 * 增加爬行轨迹
 * @param  {[type]} link 连接
 * @return {[type]}
 */
octopus.prototype.queue = function (url) {
	// insert baseURL to queue
	that._queue({
		url: opts.baseUrl,
		complete: 0,
		retry: 0
	});
};

octopus.prototype.request = function (url, callback, context) {
	var that = this;
	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			context ? callback.apply(context, arguments) : callback(error, response, body);
		}
	});
};



var octs = new octopus('../modules/xiachufang.js');
// exports interface
exports.Claw = octs;