const bluebird = require('bluebird');
const connectionModel = require('../models/connection');
const crypt = require('../tools/crypt');
const session = require('../tools/session');
const password = require('../tools/password');

exports.login = async function (ctx, next) {
	ctx.render('login');
};

exports.doLogin = async function (ctx, next) {
	try {

		const data = ctx.request.body;
		const connection = connectionModel.getConnection();
		const query = bluebird.promisify(connection.query.bind(connection));
		const results = await query(
			`select * from user where
			username = '${data.username}'`
		);

		if (results.length) {
			let user = results[0];

			// salt是空
			// 需要更新salt并且更新password
			if (!user.salt) {
				const salt = password.getSalt();
				const newPassword = password.encryptPassword(salt, user.password);
				console.log(`update user set salt = '${salt}', password = '${newPassword}' where username='${data.username}'`);
				await query(
					`update user set salt = '${salt}', password = '${newPassword}' where username='${data.username}'`
				);
				user.salt = salt;
				data.password = user.password;
			}
			const encryptedPassword = password.encryptPassword(user.salt, data.password);
			if (encryptedPassword !== user.password) {
				throw new Error('密码输入错误');
			}

			// sessionId相关
			const sessionId = session.set({
				userId: user.id
			});
			ctx.cookies.set('sessionId', sessionId, {
				httpOnly: false,
				// sameSite: 'strict',
			});

			// 登录成功，设置cookie
			// sign：加密后的userId
			// userId: 为了后续验证是不是被串改了
			// ctx.cookies.set('sign', crypt.createCrypt(user.id), {
			// 	httpOnly:false, // true 则document.cookie 获取不到
			// 	// sameSite: 'strict' // 只有同网站的请求才可以发送cookie, safari可以验证
			// });
			// ctx.cookies.set('userId', user.id, {
			// 	httpOnly:false, // true 则document.cookie 获取不到
			// 	// sameSite: 'strict' // 只有同网站的请求才可以发送cookie, safari可以验证
			// });

			ctx.body = {
				status: 0,
				data: {
					id: user.id,
					name: user.name
				}
			};
		} else {
			throw new Error('登录失败');
		}

		connection.end();
	} catch (e) {
		console.log('[/user/login] error:', e.message, e.stack);
		ctx.body = {
			status: e.code || -1,
			body: e.message
		};
	}
};
