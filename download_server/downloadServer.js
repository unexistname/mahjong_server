'use strict';

const express = require('express');
//const fs = require('fs');
const path = require('path');
const http = require('http');
const logger = require('../utils/logger');
const crypto = require('../utils/crypto');
const db = require('../utils/db');
const config = require('../common/config');
const fs = require('fs');
const url = require("url");
const qs = require("querystring");
const mime = require("mime");
const multer = require('multer');
const bodyParser = require('body-parser');
const multiparty = require('multiparty');

const app = express();
app.listen(9999);
//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let webRootPath = "www/";
app.use(function(req, res, next) {
    const { pathname, query } = url.parse(req.url, true)
    let filePath = `${webRootPath}${pathname}`;
    if (fs.existsSync(filePath)) {
        let stat = fs.lstatSync(filePath);
        if (stat.isDirectory()) {
            next();
        } else {
            res.setHeader('Content-Type', mime.lookup(pathname) +';charset=utf-8');
            fs.createReadStream(filePath).pipe(res);
        }
    } else {
        next();
    }
});