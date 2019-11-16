const Sequelize = require('sequelize');
const sequelize = require('./sequelize');

const Comment = sequelize.define('comment', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true
	},
	userId: Sequelize.INTEGER,
	postId: Sequelize.INTEGER,
	content: Sequelize.TEXT
	// createAt 和 updateAt 是创建时间和更新时间，model默认是知道的，所以不需要定义
}, {
	tableName: 'comment'
});

module.exports = Comment;
