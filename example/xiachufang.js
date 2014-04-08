var claw = require('../').Claw;

var idx = 0;
var xiachufang = new claw({
	options: {
		cache: true,
		redis: {
			host: "127.0.0.1",
			port: 6379
		},
		maxConnections: 10,
		scripts: ['http://libs.baidu.com/jquery/2.0.0/jquery.min.js'],
		userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36',
		callback: function (error, window) {
			//var $ = window.$;
			//console.log(window.url);
			//console.log(arguments);
		}
	},
	// queue url
	queue: ['http://www.xiachufang.com/category/'],
	// route regex
	route: [{
		// 首页分类
		regex: /\/category\/$/,
		callback: function (window) {
			var $ = window.$;
			var queue = $('li[id^=cat]>a').each(function (idx, href) {
				xiachufang.queue('http://www.xiachufang.com' + $(href).attr('href') + 'intro/');
			});
			//xiachufang.queue();
		}
	}, {
		// 食材详情页
		regex: /\/category\/\d+\/intro\/$/,
		callback: function (window) {
			var text = window.$('h1[class=page-title]').text();
			if (text) {
				console.log('-->', text, ', count:', idx);
				idx++;
			}
			//console.log(arguments);
		}
	}]
});

// loging
var fet = 0;
xiachufang.on('fetch', function (url) {
	console.log('fetch:', url, ', fet:', (fet++));
});

var err = 0;
xiachufang.on('faild', function (errors) {
	console.log('errors:', errors, ', err:', (err++));
});

var war = 0;
xiachufang.on('warning', function (status, info) {
	console.log('status:', status, 'info:', info, ', war:', (war++));
});

xiachufang.on('complete', function (info) {
	console.log(info);
});

// 定义入口路径
// 定义路由规则，及处理函数，并返回URL到队列。