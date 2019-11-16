const Sequelize = require('sequelize');
const sequelize = new Sequelize(
	'safety',
	'root',
	'Chenji336.',
	{
		host: 'localhost',
		dialect: 'mysql',
		define: {
			freezeTableName: true // 需要自己指定表名，不要系统去匹配
		}
	}
);

module.exports = sequelize;
