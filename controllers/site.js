const bluebird = require('bluebird');
const fs = require('fs');
const path = require('path');
const connectionModel = require('../models/connection');
const captcha = require('../tools/captcha');
const crypt = require('../tools/crypt');
const session = require('../tools/session');
const Post = require('../models/post');
const Comment = require('../models/commnet');

// 转译HTML内容
function escapeHtml (str) {
	if (!str) {
		return '';
	}
	str = str.replace(/&/g, '&amp;'); // html5之后是可以不需要转译的，不过最好加上，并且要放在第一位
	str = str.replace(/</g, '&lt;');
	str = str.replace(/>/g, '&gt;');
	str = str.replace(/"/g, '&quot;');
	str = str.replace(/'/g, '&#39;'); // 单引号也需要转译(如果index.pug src使用是单引号的话)

	// 空格也需要转译(如果index.pug src没有使用引号的话)
	// 但是不建议转译，因为html中多个空格会转变成一个，如果转译了会有问题，所以写html属性要求有引号
	// str = str.replace(/ /g, '&nbsp;');
	return str;
}

// 转译HTML属性（正式环境应该跟上面合并）
// function escapeHtmlProperty(str) {
// 	if (!str) {
// 		return '';
// 	}
// 	// str = str.replace(/&/g, '&amp;'); // html5之后是可以不需要转译的，不过最好加上
// 	str = str.replace(/"/g, '&quto;');
// 	str = str.replace(/'/g, '&#39;'); // 单引号也需要转译(如果index.pug src使用是单引号的话)

// 	// 空格也需要转译(如果index.pug src没有使用引号的话)
// 	// 但是不建议转译，因为html中多个空格会转变成一个，如果转译了会有问题，所以写html属性要求有引号
// 	// str = str.replace(/ /g, '&nbsp;');
// 	return str;
// }

// 转译js中的XSS
// 更好的替换方法 JSON.stringify
// function escapeForJs(str) {
// 	if (!str) {
// 		return '';
// 	}
// 	str = str.replace(/\//g, '\\\\'); // 斜杠也要转译，适用于这种情况 from=beijing\";alert(1);//"
// 	str = str.replace(/"/g, '\\"'); // 两个\ 是因为\也需要转译,可以去掉一个查看效果
// 	// console.log('str:', str);  // 如果没有 两个\ ，第一次转化的时候就有问题
// 	return str;
// }

exports.index = async function(ctx, next){
	const connection = connectionModel.getConnection();
	const query = bluebird.promisify(connection.query.bind(connection));
	const posts = await query(
			'select post.*,count(comment.id) as commentCount from post left join comment on post.id = comment.postId group by post.id limit 10'
		);
	const comments = await query(
			'select comment.*,post.id as postId,post.title as postTitle,user.username as username from comment left join post on comment.postId = post.id left join user on comment.userId = user.id order by comment.id desc limit 10'
		);
	ctx.render('index', {
		posts,
		comments,
		from: escapeHtml(ctx.query.from) || '',
		// fromForJs: (ctx.query.from) || '',
		fromForJs: JSON.stringify(ctx.query.from && ctx.query.from.replace('</script>', '<\\/script>')) || '', // 直接使用JSON.stringify就有bug（from有 </script>则会报错,所以直接替换掉了） https://stackoverflow.com/questions/10154514/unterminated-string-literal-invalid-or-unexpected-token
		avatarId: escapeHtml(ctx.query.avatarId) || ''
	});
	connection.end();
};

// // 黑名单
// function xssFilter(html) {
// 	if (!html) {
// 		return '';
// 	}
// 	html = html.replace(/<\s*\/?script\s*>/g,''); // 黑名单
// 	html = html.replace(/javascript:[^'"]*/g,''); // 黑名单:<a href="javascript:alert(1)">你好</a>
// 	html = html.replace(/onerror\s*=\s*['"][^'"]*['"]/g,''); // 黑名单:<img src="1" onerror="alert(1)" />
// 	return html;
// }

// 白名单
// function xssFilter(html) {
// 	if (!html) {
// 		return '';
// 	}
// 	let $ = require('cheerio'); // jquery core server 代码
// 	$ = $.load(html);
// 	const whiteList = {
// 		img: ['src'], // onerror就会去除
// 		a: ['href'],
// 		p: ['color', 'size'],
// 		font: ['color', 'size'],
// 		b: ['color', 'size']
// 	};
// 	console.log('html:', $('body').html());
// 	$('body>*').each((index, element) => { // 如果<span>xxx</span>ddd，那么ddd不会进入循环
// 		// console.log(index, element);
// 		if (!whiteList[element.name]) {
// 			$(element).remove();
// 			return ;
// 		}
// 		Object.keys(element.attribs).forEach(attr => {
// 			if (!whiteList[element.name].includes(attr)) {
// 				$(element).attr(attr, null);
// 			}
// 		});
// 	});
// 	console.log('html:', $('body').html());
// 	return $('body').html();
// }

// 使用白名单第三方库 xss
// 好处：更快捷，更全
// 坏处：定制化需要自己去学习相应api，还有可能没有
function xssFilter(html) {
	if (!html) {
		return '';
	}
	const xss = require('xss');
	return xss(html);
}

exports.post = async function(ctx, next){
	try{
		console.log('enter post');

		// 检查数据类型
		let id = ctx.params.id;
		// id = parseInt(id, 10); // 因为要验证转义，所以注释掉检查数据类型
		// console.log('id:', id);
		const connection = connectionModel.getConnection();
		// const query = bluebird.promisify(connection.query.bind(connection));
		const query = bluebird.promisify(connection.execute.bind(connection)); // mysql2参数化查询
		// console.log('connection.escape(id):', connection.escape(id)); // 转义之后很安全，数据也能查到
		// const posts = await query(
		// 	// `select * from post where id = ${connection.escape(id)}`
		// 	`select * from post where id = ?`,[id] // 等价上面一句（mysql2的参数化查询也是这样的）
		// );
		// let post = posts[0];

		// 又安全又简洁
		let post = await Post.findById(id);
		// const comments = await query(
		// 	`select comment.*,user.username from comment left join user on comment.userId = user.id where postId = "${post.id}" order by comment.createdAt desc`
		// );
		const comments = await Comment.findAll({ // left join 和 order没有执行
			where: {
				postId: post.id
			}
		});
		comments.forEach(comment => {
			comment.content = xssFilter(comment.content);
		});

		// const csrfToken = Math.floor(Math.random() * 999999, 10);
		// ctx.cookies.set('csrfToken', csrfToken); // 这个不建议放到cookie里面，而是保存在缓存中更好，而且每个用户token都不一样（演示先这样）

		if(post){
			// ctx.render('post', {post, comments, csrfToken});
			ctx.render('post', {post, comments});
		}else{
			ctx.status = 404;
		}
		connection.end();
	}catch(e){
		console.log('[/site/post] error:', e.message, e.stack);

		// 关闭错误输出
		ctx.body = {
			status: -1,
			body: '出错了'
		};
	}
};

exports.addComment = async function(ctx, next){
	try{
		let data;
		let files;
		if (ctx.request.method === 'POST') {
			data = ctx.request.body; // 最新版本获取files是ctx.request.files
			files = ctx.request.files;
		} else {
			data = ctx.request.query;
		}
		console.log('data:', data);
		console.log('files:', files);
		// 如果有上传文件
		if (files) {
			const file = files.img;
			const ext = path.extname(file.name);
			const fileName = (new Date()).getTime() + ext;
			fs.renameSync(file.path, './static/upload/' + fileName); // 有些名字有中文或则空格，最好替换掉
			data.content += `<img src="/uploadFile/${fileName}" />`; // 这个有些问题，需要优化
		}

		const connection = connectionModel.getConnection();
		const query = bluebird.promisify(connection.query.bind(connection));
		let userId = ctx.cookies.get('userId') || -1;

		// 如果验证码是空或则重来没有访问过验证码也是错误
		// const captchaContent = data.captcha;
		// if (!captchaContent || !captcha.validateCaptcha(userId, captchaContent)) {
		// 	console.log('captchaContent', captchaContent);
		// 	throw new Error('发送的验证码错误');
		// }

		// token验证
		// const csrfToken = data.csrfToken;
		// if (!csrfToken) {
		// 	throw new Error('token不能为空');
		// }
		// if (csrfToken !== ctx.cookies.get('csrfToken')) {
		// 	throw new Error('token不正确');
		// }

		// referer验证
		// const referer = ctx.request.headers.referer;
		// console.log('referer:', referer);
		// if (!/^https?:\/\/localhost/.test(referer)) {
		// 	throw new Error('referer来源错误');
		// }

		// cookie验证是否串改
		// 如果前端修改了cookie，那么ctx.cookies也是被修改的，所以可以获取到修改后的userId
		// const sign = ctx.cookies.get('sign');
		// const originSign = crypt.createCrypt(ctx.cookies.get('userId'));
		// console.log(ctx.cookies.get('userId'), sign);
		// if (sign !== originSign) {
		// 	throw new Error('报告！！cookie被串改了');
		// }

		// session验证
		const sessionId = ctx.cookies.get('sessionId');
		const sessionObj = session.get(sessionId); // 如果获取一直为空，要看下是否服务器重启过，缓存清空了
		console.log('sessionObj', sessionObj);
		// if (!sessionObj || !sessionObj.userId) { // 方便测试，正常不应该注释
		// 	throw new Error('没有找到相应的session');
		// }
		userId = sessionObj ? sessionObj.userId : -1;

		// 更换成model模式
		// const result = await query(
		// 	`insert into comment(userId,postId,content,createdAt) values("${userId}", "${data.postId}", "${data.content}",${connection.escape(new Date())})`
		// );
		const result = Comment.create({
			userId,
			postId: data.postId,
			content: data.content,
		});
		if(result){
			ctx.redirect(`/post/${data.postId}`);
		}else{
			ctx.body = 'DB操作失败';
		}
	}catch(e){
		console.log('[/site/addComment] error:', e.message, e.stack);
		ctx.body = {
			status: e.code || -1,
			body: e.message
		};
	}
};

exports.uploadFile = async function(ctx, next) {
	// 1. 获取url；
	// 2. 更换url是static/imgs
	// 3. 如果.js 通过child_process 执行

	let filePath = ctx.request.url.replace(/^\/uploadFile\//, '');
	filePath = `./static/upload/${filePath}`;
	console.log('filepath:', filePath);
	if (!fs.existsSync(filePath)) {
		ctx.response.status = 404;
		ctx.response.body = 'Page Not Found';
	}

	function run(filePath) {
		const workProcess = require('child_process').fork(filePath, {
			silent: true
		});
		return new Promise((resolve, reject) => {
			let ret = '';
			workProcess.stdout.on('data',function(data){
				ret += data;
				console.log('ret:', ret);
			});
			workProcess.stderr.on('data',function(err){
				reject(err);
			});

			workProcess.on('close',function(){
				resolve(ret);
			});
		});
	}

	if (path.extname(filePath) === '.js') {
		const data = await run(filePath);
		ctx.body = data;
		return;
	}
	ctx.body = fs.readFileSync(filePath);
};
