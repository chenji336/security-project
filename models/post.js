const Sequelize = require('sequelize');
const sequelize = require('./sequelize');

// const Model = Sequelize.Model;
// class Post extends Model {}
// Post.init({ // 这里会报错，目测淘宝注册地址安装不是最新的
// 	id: {
// 		type: Sequelize.INTEGER,
// 		primaryKey: true
// 	},
// 	title: Sequelize.STRING(256),
// 	imgUrl: Sequelize.STRING(256),
// 	content: Sequelize.TEXT
// 	// createAt 和 updateAt 是创建时间和更新时间，model默认是知道的，所以不需要定义
// }, {
// 	sequelize,
// 	modelName: 'post'
// });

const Post = sequelize.define('post', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true
	},
	title: Sequelize.STRING(256),
	imgUrl: Sequelize.STRING(256),
	content: Sequelize.TEXT
	// createAt 和 updateAt 是创建时间和更新时间，model默认是知道的，所以不需要定义
}, {
	tableName: 'post'
});

module.exports = Post;
