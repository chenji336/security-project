const Router = require('koa-router');
const router = new Router({
	prefix: ''
});

const site = require('../controllers/site');

router.all('/*', async function(ctx, next){
	console.log('enter site.js');
	ctx.set('X-XSS-Protection', 0); // 关闭浏览器的XSS拦截,safari能很好看到这个header的效果
	// ctx.set('Content-Security-Policy', `default-src 'self'`); // 不允许外界的js加载以及插入的js的运行
	await next();
});

router.get('/', site.index);
router.get('/post/:id', site.post);
router.post('/post/addComment', site.addComment);
router.get('/ajax/addComment', site.addComment); // 测试 CSRF


module.exports = router;
