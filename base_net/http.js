'use strict';

var http = require('http');
var https = require('https');
var URL = require('url');
var qs = require('querystring');
var fs = require('fs');
var path = require('path');
var crypto = require('../utils/crypto');
var logger = require('../utils/logger');
const { sign } = require('crypto');

var serverDir = path.resolve(__dirname, '..');
var errcodeAll;
function readErrcode(){
    fs.readFile(serverDir + '/common/errcode.json', function(err, data) {
        if (err) throw err;
        errcodeAll = data;
    });
}
exports.readErrcode = readErrcode;
readErrcode();

function isDictionary(obj) {
    if(!obj) return false;
    if(Array.isArray(obj)) return false;
    if(obj.constructor != Object) return false;
    return true;
};

exports.getLocalIP = function () {
    ///获取本地的IP地址
    const config = require('../common/config');
    return config.servers.login_hall.servers.url.split(":")[0];
}

exports.get = function (url,data,callback,safe, headers) {
    var content = qs.stringify(data);
    var url2;
    if (content) {
        url2 = url + '?' + content;
    } else {
        url2 = url;
    }
    // var url2 = url + '?' + content;
    var proto = http;
    if(safe){
        proto = https;
    }
    logger.log(url2);
    proto.get(url2, function(res) {
        //logger.log('STATUS: ' + res.statusCode);
        //logger.log('HEADERS: ' + JSON.stringify(res.headers));
        res.setEncoding('utf8');
        if(safe){
            res.on('data', function (data) {
                const json = JSON.parse(data);
                callback(true,json);
            });
        }
        else{
            let rawData = '';
            res.on('data', function(chunk) { rawData += chunk; });
            res.on('end', function() {
                try {
                    const parsedData = JSON.parse(rawData);
                    callback(true,parsedData);
                } catch (e) {
                    logger.error_log(e.message);
                    callback(false,e);
                }
            });
        }
    }).on('error', function(e) {
        logger.error_log(e.message);
        callback(false,e);
    });
}

exports.post = function (url,data,callback,safe, authorization) {
    let address = URL.parse(url);
    var proto = http;
    if(safe){
        proto = https;
    }
    const postData = JSON.stringify(data);
    const options = {
        hostname: address.host,
        port: address.port,
        path: address.path,
        method: 'POST',
        headers: {
            'Authorization': authorization || "",
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    logger.log(address, postData);
    var req = proto.request(options, (res) => {
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => {
            rawData += chunk;
        });
        res.on('end', () => {
            try {
                callback(true,rawData);
            } catch (e) {
                logger.error_log(e.message);
                callback(false,e);
            }
        });
    }).on('error', (e) => {
        logger.error_log(e.message);
        callback(false,e);
    });

    // 写入数据到请求主体
    req.write(postData);
    req.end();
}

exports.request = function(url,method,data,authorization,callback) {
    var proto = https;
    var address = url;
    var isGet = method == "GET";
    if (isGet && data) {
        var content = qs.stringify(data);
        address = url + "?" + content;
    }
    var body = data ? JSON.stringify(data) : "";
    address = URL.parse(address);

    var options = {
        hostname: address.host,
        port: address.port,
        path: address.path,
        method: method,
        headers: {
            'Authorization': authorization,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
            'Content-Length': isGet ? 0 : Buffer.byteLength(body),
        }
    };
    var req;
    if (isGet) {
        req = proto.request(options, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (data) {
                const json = JSON.parse(data);
                callback(true,json);
            });
        }).on('error', function(e) {
            logger.error_log(e.message);
            callback(false,e);
        });
    } else {
        req = proto.request(options, (res) => {
            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => {
                rawData += chunk;
            });
            res.on('end', () => {
                try {
                    callback(true,rawData);
                } catch (e) {
                    logger.error_log(e.message);
                    callback(false,e);
                }
            });
        }).on('error', (e) => {
            logger.error_log(e.message);
            callback(false,e);
        });
        if (data) {
            req.write(body);
        }
    }
    req.end();
}

exports.send = function(res,errcode,data){
    if(data == null){
        data = {};
    }
    if(errcode != 0){
        data = {};
        data.errcode = errcode;
    }
    //var jsonstr = crypto.cipher(JSON.stringify(data));
    //res.send(jsonstr);
    //logger.log(data);
    res.send(JSON.stringify(data));
};

// 错误时发送错误描述（默认前端自己保存）
exports.send2 = function(res,errcode,data){
    if(data == null){
        data = {};
    }
    if(errcode != 0){
        data = {};
        data.errcode = errcode;
        data.errmsg = errcodeAll[errcode];
    }
    var jsonstr = crypto.cipher(JSON.stringify(data));
    res.send(jsonstr);
};
