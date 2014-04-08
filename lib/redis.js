var util = require('util'),
	events = require('events'),
	redis = require("redis");


function storage(config) {
	events.EventEmitter.call(this);
	this.client = redis.createClient();
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
storage.prototype.pushQueue = function (url, callback) {
	this.client.rpush('oct_queue', url, function (err, result) {
		callback && callback(!err && 1 ? result : 0, result);
	});
	return this;
};

/**
 * pop one queue
 * @param  {Function} callback
 * @return {Object} Redis Client
 */
storage.prototype.popQueue = function (callback) {
	this.client.lpop('oct_queue', function (err, result) {
		callback(!err && result ? 1 : 0, result);
	});
	return this;
};

storage.prototype.lenQueue = function (callback) {
	this.client.llen('oct_queue', function (err, result) {
		callback(!err && result ? 1 : 0, result);
	});
	return this;
};

/**
 * hset an cache
 * @param  {String} url
 * @return {Object} Redis Client
 */
storage.prototype.hsetCache = function (url, body, callback) {
	this.client.hset('oct_cache', url, function (err, result) {
		callback && callback(!err && 1 ? result : 0, result);
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
		callback(!err && result ? 1 : 0, result);
	});
	return this;
};



exports.Storage = storage;