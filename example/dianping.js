var claw = require('../').Claw;

var idx = 0;
var zhuna = new claw({
	options: {
		cache: true,
		redis: {
			host: '127.0.0.1',
			port: 6379
		},
		maxConnections: 10,
		scripts: ['http://libs.baidu.com/jquery/2.0.0/jquery.min.js'],
		userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.152 Safari/537.36',
		callback: function (error, window) {
			if (window && window.$) {
				var $ = window.$;
				/*
				.filter(function () {
					console.log(this.href);
					return this.href.match(/\/shop\/\d+$/)
				})
				 */
				$('a[href]').each(function (idx, href) {
					var link = $(href).attr('href');
					try {
						if (link.match(/^http/i)) {
							zhuna.queue($(href).attr('href'));
						} else {
							zhuna.queue('http://www.dianping.com' + link);
						}
					} catch (e) {
						console.error(link);
					}

				});
			}
		}
	},
	// queue url
	queue: ['http://www.dianping.com/'],
	// route regex
	route: [{
		// 酒店详情页面
		regex: /\/shop\/\d+$/,
		callback: function (window) {
			var text = window.$('.top_nav>h1').text().trim();;
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
zhuna.on('fetch', function (data) {
	console.log('->fetch:', data.url, ', fet:', (fet++));
	console.log('->remain:', data.remain, ', loading:', data.loading);
});

var err = 0;
zhuna.on('errors', function (errors) {
	console.log('->errors:', errors, ', err:', (err++));
});

var war = 0;
zhuna.on('warning', function (status, info) {
	console.log('->status:', status, ', info:', info, ', war:', (war++));
});

zhuna.on('complete', function (info) {
	console.log(info);
});