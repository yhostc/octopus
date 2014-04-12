var claw = require('../').Claw;

var idx = 0;
var xiachufang = new claw({
	options: {
		cache: true,
		redis: {
			host: '127.0.0.1',
			port: 6379
		},
		maxConnections: 10,
		userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36',
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
			var queue = $('li[id^=cat]>a').each(function (idx, href) {
				xiachufang.queue('http://www.xiachufang.com' + $(href).attr('href') + 'intro/');
			});
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