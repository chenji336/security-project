const data = {};

exports.getCaptcha = function (ctx) {
	const ccap = require('ccap')();
	const info = ccap.get();
	console.log('captcha:', info[0]);
	data[ctx.cookies.get('userId')] = info[0];
	ctx.body = info[1];
};

exports.validateCaptcha = function(userId, captcha) {
	return data[userId] === captcha;
};
