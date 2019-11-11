const password = {};

const md5 = function (str) {
	const encrypto = require('crypto');
	const md5Hash = encrypto.createHash('md5');
	md5Hash.update(str);
	return md5Hash.digest('hex');
};

password.encryptPassword = function(salt, password) {
	return md5(salt + 'Chenjixxxx.[123]-' + password);
};

password.getSalt = function() {
	return md5(Math.random() * 999999 + '' + new Date().getTime());
};

password.encryptClientPassword = function(username, password) {
	const KEY = '@#$$Chenji88.';
	return md5(username + KEY + password);
};

module.exports = password;
