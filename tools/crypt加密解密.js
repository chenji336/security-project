// 跟crypt.js不同：crypt需要同时有 sign和userid，而本js只需要一个就可以自己解密
// 本js只做演示，没有用到该项目中

const crypto = require('crypto');
const algorithm = 'aes-192-cbc';
// const password = '用于生成密钥的密码';
// // 改为使用异步的 `crypto.scrypt()`。
// const key = crypto.scryptSync(password, 'salt', 24); // crypto.scryptSync was added in node 10.5.0
const key = 'fsfdsfs%%^^!!!####ddd';

function encryption() {
	const cipher = crypto.createCipher(algorithm, key);
	let encrypted = cipher.update('要加密的数据', 'utf8', 'hex'); // utf8 => hex
	encrypted += cipher.final('hex'); // final作用：1.后续不能在进行加密解密了（后续在写也无用） 2.返回最后一个字符
	console.log('encrypted:', encrypted);
	return encrypted;
}
encryption();


function decryption() {
	const cipher = crypto.createDecipher(algorithm, key);
	let decrypted = cipher.update(encryption(), 'hex', 'utf8'); // hex => utf8
	decrypted += cipher.final('utf8');
	console.log('decrypted:', decrypted);
}
decryption();
