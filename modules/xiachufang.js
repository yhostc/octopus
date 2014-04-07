var octopus = require('../');


/**
 * 定义模块: 下厨房
 * @param  {Object} oct Octopus实例
 * @return {Object}
 */
var xiachufang = function (oct) {

	// 指定配置
	this.options = {
		// 唯一标识符
		id: 'xiachufang',
		// 入口地址
		baseUrl: 'http://www.xiachufang.com/'
	};
}

xiachufang.prototype = {

	/**
	 * 定义路由
	 * @param  {Object}   req
	 * @param  {Function} next
	 * @return {Object}
	 */
	route: function (app) {
		//app.get(/(.*)/g, this.index);
		// 定义路由
		app.get(/\/category\/\d+/, this.category, this);
	},

	/**
	 * 分类数据抓取
	 * @param  {[type]}   req
	 * @param  {Function} next
	 * @return {[type]}
	 */
	category: function (req, next) {
		console.log(arguments);
	}
}


module.exports = new xiachufang();

// 定义入口路径
// 定义路由规则，及处理函数，并返回URL到队列。