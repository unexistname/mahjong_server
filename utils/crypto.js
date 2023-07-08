'use strict';

var crypto = require('crypto');

var secret = "ljjyxwh";
const {KJUR, hextob64, b64tohex} = require('jsrsasign')

exports.RSA_TYPE = {
    SHA256withRSA: 'SHA256withRSA',
    SHA1withRSA: 'SHA1withRSA'
}

exports.AES_TYPE = {
    AES_256_ECB : 'aes-256-ecb',
    AES_256_GCM : 'aes-256-gcm',
}

/**
 * rsa签名
 * @param content 签名内容
 * @param privateKey 私钥，PKCS#1
 * @param hash hash算法，SHA256withRSA，SHA1withRSA
 * @returns 返回签名字符串，base64
 */
exports.rsa = function (content, privateKey, hash) {
    // 创建 Signature 对象
    const signature = new KJUR.crypto.Signature({
        alg: hash,
        //!这里指定 私钥 pem!
        prvkeypem: privateKey
    })
    signature.updateString(content)
    const signData = signature.sign()
    // 将内容转成base64
    return hextob64(signData)
}

exports.rsaVerify = function(content, signData, publicKey) {
    let verify = crypto.createVerify('RSA-SHA256');
    verify.update(Buffer.from(content));
    var res = verify.verify(publicKey, signData, 'base64');
    return res
}

exports.hash = function (content) {
    const md5 = crypto.createHash('md5');
	md5.update(content);
	return md5.digest('hex');
}
exports.hmac = function (content) {
    const md5 = crypto.createHmac('md5', secret);
    md5.update(content);
    return md5.digest('hex');
}
exports.cipher = function(content, algorithm){
    const cipher = crypto.createCipher(algorithm || 'aes-256-ecb', secret);//aes-256-ecb
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}
exports.decipher = function(ciphertext, key, nonce, associated_data){
    const AUTH_KEY_LENGTH = 16;
    // ciphertext = 密文，associated_data = 填充内容， nonce = 位移
    // 密钥
    const key_bytes = Buffer.from(key, 'utf8');
    // 位移
    const nonce_bytes = Buffer.from(nonce, 'utf8');
    // 填充内容
    const associated_data_bytes = Buffer.from(associated_data, 'utf8');
    // 密文Buffer
    const ciphertext_bytes = Buffer.from(ciphertext, 'base64');
    // 计算减去16位长度
    const cipherdata_length = ciphertext_bytes.length - AUTH_KEY_LENGTH;
    // upodata
    const cipherdata_bytes = ciphertext_bytes.slice(0, cipherdata_length);
    // tag
    const auth_tag_bytes = ciphertext_bytes.slice(cipherdata_length, ciphertext_bytes.length);
    
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm', key_bytes, nonce_bytes
    );
    decipher.setAuthTag(auth_tag_bytes);
    decipher.setAAD(Buffer.from(associated_data_bytes));

    let decrypted = Buffer.concat([
        decipher.update(cipherdata_bytes),
        decipher.final(),
    ]);
    return decrypted.toString();
}
exports.cipher_AES_256_ECB = function(content){
    const cipher = crypto.createCipher('aes-256-ecb', secret);//aes-256-ecb
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}
exports.decipher_AES_256_ECB = function(content){
    const decipher = crypto.createDecipher('aes-256-ecb', secret);
    let decrypted = decipher.update(content , 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
exports.toBase64 = function(content){
	return new Buffer(content).toString('base64');
}

exports.fromBase64 = function(content){
	return new Buffer(content, 'base64').toString();
}
