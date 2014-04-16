var claw = require('../').Claw;

var idx = 0;
var xiachufang = new claw({
	options: {
		cache: true,
		redis: {
			host: '127.0.0.1',
			port: 6379
		},
		idleTime: 500,
		userAgent: 'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
		callback: function ($) {
			//console.log($.url);
			//console.log(arguments);
		}
	},
	// queue url
	queue: ['http://www.xiachufang.com/category/'],
	// route regex
	route: [{
		// 首页分类
		regex: /\/category\/$/,
		callback: function ($) {
			var links = [];
			var queue = $('li[id^=cat]>a').each(function (idx, href) {
				var url = 'http://www.xiachufang.com' + $(href).attr('href') + 'intro/';
				links.push(url);
			});
			xiachufang.queue(links);
		}
	}, {
		// 食材详情页
		regex: /\/category\/\d+\/intro\/$/,
		callback: function ($) {
			var text = $('h1[class=page-title]').text();
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
xiachufang.on('fetch', function (data) {
	console.log('->fetch:', data.url, ', fet:', (fet++));
	console.log('->remain:', data.remain, ', loading:', data.loading);
});

var err = 0;
xiachufang.on('errors', function (errors) {
	console.log('->errors:', errors, ', err:', (err++));
});

var war = 0;
xiachufang.on('warning', function (status, info) {
	console.log('->status:', status, ', info:', info, ', war:', (war++));
});

xiachufang.on('complete', function (info) {
	console.log(info);
});