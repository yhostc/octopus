var octopus = require('../');

module.exports = {
	/**
	 * 定义路由结构
	 * @param  {Object}   req
	 * @param  {Function} next
	 * @return {Object}
	 */
	route: function(app, next) {
		app.get('/category', this.parse);
	},


	parse: function(req, next) {

	}


};