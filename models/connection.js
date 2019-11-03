const mysql = require('mysql');
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
