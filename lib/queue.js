var util = require('util'),
	events = require('events'),
	redis = require("redis");


function storage(config, debug) {
	events.EventEmitter.call(this);
	this.client = redis.createClient(config.port, config.host);
	// flushdb
	debug && this.flushdb();
}
util.inherits(storage, events.EventEmitter);


/**
 * flush redis db
 * @return {Object} Redis Client
 */
storage.prototype.flushdb = function () {
	this.client.flushdb();
	return this;
};

/**
 * push one queue
 * @param  {String} url
 * @return {Object} Redis Client
 */
storage.prototype.pushQueue = function (urls, callback) {
	if (typeof urls === 'string') {
		urls = [urls];
	}
	var cli = this.client;
	cli.rpush.apply(cli, ['oct_queue'].concat(urls, function (err, result) {
		callback && callback(err && !result, result);
	}));
	return this;
};

/**
 * pop one queue
 * @param  {Function} callback
 * @return {Object} Redis Client
 */
storage.prototype.popQueue = function (callback) {
	this.client.lpop('oct_queue', function (err, result) {
		callback(err && !result ? 1 : 0, result);
	});
	return this;
};

storage.prototype.lenQueue = function (callback) {
	this.client.llen('oct_queue', function (err, result) {
		callback(err && !result ? 1 : 0, result);
	});
	return this;
};

/**
 * hset an cache
 * @param  {String} url
 * @return {Object} Redis Client
 */
storage.prototype.hsetCache = function (url, body, callback) {
	this.client.hset('oct_cache', url, body, function (err, result) {
		callback && callback(err && !result ? 1 : 0, result);
	});
	return this;
};

/**
 * hget an cache
 * @param  {String} url
 * @return {Object} Redis Client
 */
storage.prototype.hgetCache = function (url, callback) {
	this.client.hget('oct_cache', url, function (err, result) {
		callback(err && !result ? 1 : 0, result);
	});
	return this;
};



exports.Storage = storage;