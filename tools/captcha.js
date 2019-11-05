const captcha = {};
const cache = {};

captcha.getCaptcha = function (ctx) {
	const ccap = require('ccap')();
	const info = ccap.get();
	console.log('captcha:', info[0]);
	cache[ctx.cookies.get('userId')] = info[0];
	ctx.body = info[1];
};

captcha.validateCaptcha = function(userId, captcha) {
	return cache[userId] === captcha;
};

module.exports = captcha;
