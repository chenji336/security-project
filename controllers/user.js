const bluebird = require('bluebird');
const connectionModel = require('../models/connection');
const crypt = require('../tools/crypt');

exports.login = async function(ctx, next){
	ctx.render('login');
};

exports.doLogin = async function(ctx, next){
	try{

		const data = ctx.request.body;
		const connection = connectionModel.getConnection();
		const query = bluebird.promisify(connection.query.bind(connection));
		const results = await query(
			`select * from user where
			username = '${data.username}'
			and password = '${data.password}'`
		);
		if(results.length){
			let user = results[0];

			// 登录成功，设置cookie
			// sign：加密后的userId
			// userId: 为了后续验证是不是被串改了
			ctx.cookies.set('sign', crypt.createCrypt(user.id), {
				httpOnly:false, // true 则document.cookie 获取不到
				// sameSite: 'strict' // 只有同网站的请求才可以发送cookie, safari可以验证
			});
			ctx.cookies.set('userId', user.id, {
				httpOnly:false, // true 则document.cookie 获取不到
				// sameSite: 'strict' // 只有同网站的请求才可以发送cookie, safari可以验证
			});

			ctx.body = {
				status: 0,
				data:{
					id: user.id,
					name: user.name
				}
			};
		}else{
			throw new Error('登录失败');
		}

		connection.end();
	}catch(e){
		console.log('[/user/login] error:', e.message, e.stack);
		ctx.body = {
			status: e.code || -1,
			body: e.message
		};
	}
};
