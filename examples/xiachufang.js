var octopus = require('../');


/**
 * 定义模块: 下厨房
 * @param  {Object} oct Octopus实例
 * @return {Object}
 */
var xiachufang = function (oct) {
	var options = {
		// 唯一标识符
		id: 'xiachufang',
		// 基本入口地址
		baseUrl: 'http://www.xiachufang.com/',
		// 是否跳过重复
		skipDuplicates: true
	}

	// 加载模块配置
	oct.load(this, options);

	return this;
}

xiachufang.prototype = {
	/**
	 * 定义路由
	 * @param  {Object}   req
	 * @param  {Function} next
	 * @return {Object}
	 */
	route: function (app) {
		// 定义路由
		app.get('/category', this.category);
	},

	/**
	 * 分类数据抓取
	 * @param  {[type]}   req
	 * @param  {Function} next
	 * @return {[type]}
	 */
	category: function (req, next) {


	}
}


module.exports = new xiachufang();

// 定义入口路径
// 定义路由规则，及处理函数，并返回URL到队列。