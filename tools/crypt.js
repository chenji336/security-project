const crypt = {};
const SECRET = 'fsdfs#@!dd.()-'; // 越复杂越好

crypt.createCrypt = function (id) {
	const crypto = require('crypto');
	return crypto.createHmac('sha256', SECRET)
		.update(id + '')
		.digest('hex');
};

module.exports = crypt;
