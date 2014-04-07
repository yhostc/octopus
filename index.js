/**
 * 本模块负责模块管理、监控工作
 * @type {[type]}
 */
var fs = require('fs'),
	util = require('util'),
	events = require('events'),
	packages = require('./package.json');

var poolModule = require('generic-pool');


/**
 * An website spider framework for nodejs, directional depth crawling
 * @param  {[Object]} opts
 * @return {[type]}
 */
function octopus() {
	events.EventEmitter.call(this);
	// 资源管理器
	var pool = poolModule.Pool({
		name: packages.name,
		create: function (callback) {
			// do something
			callback(1);
		},
		destroy: function (client) {
			// cleanup.  omitted for this example
		},
		max: 10,
		idleTimeoutMillis: 30000,
		priorityRange: 3
	});

	this._pool = pool;
};
util.inherits(octopus, events.EventEmitter);


/**
 * 加载模块
 * @param  {Object} defaultOptions  默认参数
 * @return {[type]}         [description]
 */
octopus.prototype.loads = function (defaultOptions) {
	// 实例
	this._instances = {};
	// 队列
	this._queue = [];
	// index
	this._idx = 0;

	// check modules
	var path = './modules';
	if (!fs.existsSync(path)) {
		throw ('examples path is not founded!');
	}
	// load modules
	var that = this;
	var files = fs.readdirSync(path);
	files.forEach(function (file) {
		var m = require(path + '/' + file);
		if (!m.options) {
			throw ('the moudle ' + file + ' is not found options');
		}
		if (!m.route) {
			throw ('the moudle ' + file + ' is not found route function');
		}

		// mix options
		var opts = extend(defaultOptions, m.options);

		// route
		// cache instances
		if (this._instances[opts.id]) {
			// have loaded this module;
			return;
		}
		this._instances[opts.id] = m;

	});

	// initialization for request
	//this.request(this.request.apply(this, this._routes[0]));
};

// Default Options
var defaultOptions = {
	method: "GET",
	timeout: 60000,
	jQuery: true,
	retries: 3,
	autoWindowClose: true,
	retryTimeout: 10000,
	cache: false, //false,true, [ttl?]
	skipDuplicates: false,
	userAgent: packages.name + '/' + packages.version
};

var octs = new octopus();
octs.loads(defaultOptions);