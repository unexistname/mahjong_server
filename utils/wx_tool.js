'use strict';

// const urllib = require('urllib');
const http = require('../base_net/http');
const crypto = require('../utils/crypto');
const x509 = require('@peculiar/x509');
const URL = require('url');
const fs = require('fs');
const path = require('path');
const { ErrorCode } = require('../game_server/ErrorCode');

var wxInfo = {
    appid:"wx02b8313157685a8f",     // 微信应用ID
    secret:"ningdemajiang123456NINGDEMAJIANG",  // 商户密钥
    mchid:"1638283123",         // 商户号
    serial_no: "771AD580CEF1C675F7CC0271D2C9F56D8A555820",  // 商户证书序列号
    certificates: {},   // 平台证书列表{平台证书序列号：微信返回的证书数据}
    notify_url: "https://majiang.autoeco.com.cn/pay_result",
    order_url: "https://api.mch.weixin.qq.com/v3/pay/transactions/app",
    certificate_url: "https://api.mch.weixin.qq.com/v3/certificates",
};

var getRandomString = function(len = 30) {
    const str = "ABCDEFGHIJKLMNOPQRSTUVWZXYabcdefghijklmnopqrstuvwxyz012345789";
    var res = "";
    for (var i = 0; i < len; ++i) {
        var index = Math.floor(Math.random() * str.length);
        res = res + str[index];
    }
    return res;
};

var getWXPaySign = function(appid, prepay_id, nonce_str, timeStamp) {
    var data = Array(appid, timeStamp, nonce_str, prepay_id).join("\n") + "\n";
    return crypto.rsa(data, getPrivateKey(), crypto.RSA_TYPE.SHA256withRSA);
};

var getPrivateKey = function() {
    let pkey = fs.readFileSync(path.join(__dirname, "..", "secure", "apiclient_key.pem"));
    let privateKey = new Buffer(pkey).toString();
    return privateKey;
}

var getPublicKey = function(certificate) {
    let beginIndex = certificate.indexOf('-\n')
    let endIndex = certificate.indexOf('\n-')
    let str = certificate.substring(beginIndex + 2, endIndex)
    let x509Certificate = new x509.X509Certificate(Buffer.from(str, 'base64'));
    let public_key = Buffer.from(x509Certificate.publicKey.rawData).toString('base64')
    return `-----BEGIN PUBLIC KEY-----\n` + public_key + `\n-----END PUBLIC KEY-----`
}

function decryptWXData(key, encrypt_data) {
    var ciphertext = encrypt_data.ciphertext;
    var nonce = encrypt_data.nonce;
    var associated_data = encrypt_data.associated_data;
    return crypto.decipher(ciphertext, key, nonce, associated_data);
}

function sendWXRequest(url, method, body, callback) {
    var authorization = getWXAuthorization(url, method, body);
    http.request(url, method, body, authorization, callback);
}

function updateCertificates(callback) {
    sendWXRequest(wxInfo.certificate_url, "GET", null, function(suc, ret) {
        if (suc && ret && ret.data) {
            for (var i = 0; i < ret.data.length; ++i) {
                var certificate = ret.data[i];
                var serial_no = certificate.serial_no;
                if (wxInfo.certificates[serial_no]) {
                    continue;
                }
                wxInfo.certificates[serial_no] = certificate;
                wxInfo.certificates[serial_no].certificate = decryptWXData(wxInfo.secret, certificate.encrypt_certificate);
            }
        }
        if (callback) {
            callback();
        }
    });
}

function getWXAuthorization(url, method, body) {
    let address = URL.parse(url);
    var pathname = address.path;
    var timeStamp = Math.floor(Date.now() / 1000);
    var nonce_str = getRandomString();
    if (!(body instanceof String)) {
        body = body ? JSON.stringify(body) : "";
    }
    var data = Array(method, pathname, timeStamp, nonce_str, body).join("\n") + "\n";
    var schema = "WECHATPAY2-SHA256-RSA2048";
    var sign = crypto.rsa(data, getPrivateKey(), crypto.RSA_TYPE.SHA256withRSA);
    var info = {
        mchid: wxInfo.mchid,
        nonce_str: nonce_str,
        serial_no: wxInfo.serial_no,
        timestamp: timeStamp,
        signature: sign,
    }
    var token = "";
    for (var key in info) {
        var value = key + "=" + '"' + info[key] + '"';
        if (token) {
            token = token + "," + value;
        } else {
            token = value;
        }
    }
    return schema + " " + token;
}

exports.getPrepayId = function(body, callback) {
    sendWXRequest(wxInfo.order_url, "POST", body, function(suc, ret) {
        var data = JSON.parse(ret);
        var prepay_id = data ? data.prepay_id : null;
        callback(prepay_id);
    });
}

exports.getWXOrderData = function(prepay_id, orderCreateTime) {
    var nonce_str = getRandomString();
    var timeStamp = Math.floor(orderCreateTime / 1000).toString();
    var sign = getWXPaySign(wxInfo.appid, prepay_id, nonce_str, timeStamp);
    return {
        mch_id: wxInfo.mchid,
        prepay_id: prepay_id,
        nonce_str: nonce_str,
        timeStamp: timeStamp,
        packageValue: "Sign=WXPay",
        sign: sign,
    };
}

exports.getWXRequestOrderData = function(userId, orderId, rechargeId, description, money) {
    return {
        appid: wxInfo.appid,
        mchid: wxInfo.mchid,
        description: description,
        out_trade_no: "Order" + orderId,
        notify_url: wxInfo.notify_url,
        amount: {
            total: money,
            currency: "CNY",
        },
        attach: JSON.stringify({
            userId: userId,
            orderId: orderId,
            rechargeId: rechargeId,
        }),
    };
}

function getCertificate(serial, callback, isRetry) {
    if (wxInfo.certificates[serial]) {
        callback(wxInfo.certificates[serial]);
    } else if (isRetry) {
        callback();
    } else {
        updateCertificates(function() {
            getCertificate(serial, callback, true);
        });
    }
}

exports.verifyPayNotify = function(headers, data, callback) {
    var timeStamp = headers["Wechatpay-Timestamp".toLowerCase()];
    var nonce_str = headers["Wechatpay-Nonce".toLowerCase()];
    var sign = headers["Wechatpay-Signature".toLowerCase()];
    var serial = headers["Wechatpay-Serial".toLowerCase()];
    var body = JSON.stringify(data);

    if (!timeStamp || !nonce_str || !sign) {
        callback(ErrorCode.REQUEST_HEADER_ERROR);
        return;
    }

    getCertificate(serial, function(certificate) {
        if (certificate) {
            var publicKey = getPublicKey(certificate.certificate);
            var src = `${timeStamp}\n${nonce_str}\n${body}\n`;
            if (crypto.rsaVerify(src, sign, publicKey)) {
                var orderData = decryptWXData(wxInfo.secret, data.resource);
                orderData = JSON.parse(orderData);
                callback(ErrorCode.SUCCESS, orderData);
            } else {
                callback(ErrorCode.SIGN_VERIFY_FAIL);
            }            
        } else {
            callback(ErrorCode.MERCHANT_CERTIFICATE_SERIAL_NUMBER_INCORRECT);
        }
    });
}