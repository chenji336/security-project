const bluebird = require('bluebird');
const connectionModel = require('../models/connection');

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
		fromForJs: JSON.stringify(ctx.query.from) || '',
		avatarId: escapeHtml(ctx.query.avatarId) || ''
	});
	connection.end();
};

exports.post = async function(ctx, next){
	try{
		console.log('enter post');

		const id = ctx.params.id;
		const connection = connectionModel.getConnection();
		const query = bluebird.promisify(connection.query.bind(connection));
		const posts = await query(
			`select * from post where id = "${id}"`
		);
		let post = posts[0];

		const comments = await query(
			`select comment.*,user.username from comment left join user on comment.userId = user.id where postId = "${post.id}" order by comment.createdAt desc`
		);
		if(post){
			ctx.render('post', {post, comments});
		}else{
			ctx.status = 404;
		}
		connection.end();
	}catch(e){
		console.log('[/site/post] error:', e.message, e.stack);
		ctx.body = {
			status: e.code || -1,
			body: e.message
		};
	}
};

exports.addComment = async function(ctx, next){
	try{
		const data = ctx.request.body;
		const connection = connectionModel.getConnection();
		const query = bluebird.promisify(connection.query.bind(connection));
		const result = await query(
			`insert into comment(userId,postId,content,createdAt) values("${ctx.cookies.get('userId')}", "${data.postId}", "${data.content}",${connection.escape(new Date())})`
		);
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
