// const mysql = require('mysql');
const mysql = require('mysql2');
exports.getConnection = function(){
	let connection = mysql.createConnection({
		host: 'localhost',
		port: '3306',
		user: 'root',
		password: 'Chenji336.',
		database: 'safety',
	});
	connection.connect();
	return connection;
};
