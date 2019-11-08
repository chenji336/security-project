const Koa = require('koa');
const app = new Koa();

const koaStatic = require('koa-static');
app.use(koaStatic('./static', {
	hidden: true,
	maxage: 365*24*3600*1000
}));
const bodyParser = require('koa-bodyparser');
app.use(bodyParser());

const Pug = require('koa-pug');
/*const pug = */new Pug({
	app,
	viewPath: './views',
	noCache: process.env.NODE_ENV === 'development'
});

const routes = ['site', 'user'];
routes.forEach((route) => {
	app.use(require(`./routes/${route}`).routes());
});

// http 启动
// app.listen(8080, function(){
// 	console.log('App is listening on port 8080');
// });

// https 启动
const https = require('https');
const fs = require('fs');
// 不安全，在生成证书的时候没有配置域名
// const options = {
// 	key: fs.readFileSync('/usr/local/etc/nginx/certs/localhost-privkey-new.pem'),
// 	cert: fs.readFileSync('/usr/local/etc/nginx/certs/localhost-cert-new.pem')
// };
// 安全
const optionsSecure = {
	key: fs.readFileSync('./localhost-privkey-secure.pem'),
	cert: fs.readFileSync('./localhost-cert-secure.pem')
};
https.createServer(optionsSecure, app.callback()).listen(8080);
console.log('https server is running on port 8080');
