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
const { default: AllUserMgr } = require("../common/AllUserMgr");
const { default: LogUtil } = require('../utils/LogUtil');

const app = express();
app.listen(8899);
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

// let mime={
//     '.html': 'text/html',
//     '.js':'application/javascript',
//     '.css':'text/css'
// }

var webRootPath = "./www";

var storage = multer.diskStorage({
    //文件存储路径
    destination: function (req, file, cb) {
        var savePath = path.join(__dirname, "..", webRootPath, "img");
        logger.admin_log("文件存储路径", savePath);
        cb(null, savePath);
    },
    //修改上传文件的名字
    //file 是个文件对象 ,fieldname对应在客户端的name属性
    //存储的文件需要自己加上文件的后缀，multer并不会自动添加
    //这里直接忽略文件的后缀.
    filename: function (req, file, cb) {
        cb(null, encodeURI(file.originalname));
    }
});
let objMulter = multer({storage : storage });

function dealPostFunc(req, callback) {
    var buffer = "";
    req.on("data", function(chunk) {
        buffer += chunk;
    });
    req.on("end", function() {
        var postData = qs.parse(buffer);
        // logger.admin_log("post数据为", postData);
        callback(postData);
    })
}

app.get("/", function(req, res) {
    res.setHeader('Content-Type','text/html;charset=utf-8');
    fs.createReadStream(`${webRootPath}/index.html`).pipe(res);
});

app.get("/get_all_user_info", function(req, res) {
    safeDoAction(req, res, function() {
        db.get_all_user_info(function(datas) {
            db.get_all_player_wins_rate(function(records) {
                var userIdArr = AllUserMgr.ins.getOnlineUserIds();
                for (var i = 0; i < datas.length; ++i) {
                    var userId = datas[i].userId;
                    var record = records[userId];
                    if (record) {
                        datas[i].total = record[0];
                        datas[i].win = record[1];
                        datas[i].lose = record[2];
                        datas[i].draw = record[3];
                    }
                    if (userIdArr.indexOf(userId) >= 0) {
                        datas[i].online = true;
                    }
                }
                res.end(JSON.stringify(datas));
            });
        });
    });
});

app.get("/get_online_user_amount", function(req, res) {
    safeDoAction(req, res, function() {
        let amount = AllUserMgr.ins.getOnlineUserAmount();
        res.end(JSON.stringify(amount));
    });
});

app.get("/get_all_user_permission", function(req, res) {
    safeDoAction(req, res, function() {
        db.get_all_user_permission(function(permissionUsers) {
            var permissionDict = {};
            for (let i = 0; i < permissionUsers.length; ++i) {
                let key = permissionUsers[i].userId;
                let value = permissionUsers[i].times;
                permissionDict[key] = value;
            }
            db.get_all_user_id_and_base_info(function(allUser) {
                var datas = [];
                for (let i = 0; i < allUser.length; ++i) {
                    let permission = permissionDict[allUser[i].userId];
                    datas.push({
                        userId: allUser[i].userId,
                        userName: allUser[i].userName,
                        permission: permission || 0,
                        gems: allUser[i].gems,
                    });
                }
                logger.admin_log("权限用户", datas);
                res.end(JSON.stringify(datas));
            });
        });
    });
});

app.get("/set_user_black", function(req, res) {
    let query = req.query;
    safeDoAction(req, res, function() {
        db.set_user_black(query.userId, query.black, function(isSuccess) {
            if (isSuccess) {
                logger.admin_log(query);
                res.end(JSON.stringify(query));
            } else {
                res.end();
            }
        });
    });
});

app.get("/set_user_permission", function(req, res) {
    let query = req.query;
    safeDoAction(req, res, function() {
        db.set_user_permission(query.userId, query.permission, function(isSuccess) {
            if (isSuccess) {
                logger.admin_log(query);
                res.end(JSON.stringify(query));
            } else {
                res.end();
            }
        });
    });
});

app.get("/get_all_prop", function(req, res) {
    safeDoAction(req, res, function() {
        db.get_all_prop(function(datas) {
            res.end(JSON.stringify(datas));
        });
    });
});

app.get("/get_all_series", function(req, res) {
    safeDoAction(req, res, function() {
        db.get_all_series(function(datas) {
            res.end(JSON.stringify(datas));
        });
    });
});

app.get("/update_series", function(req, res) {
    let query = req.query;
    safeDoAction(req, res, function() {
        db.update_series(query, function(data) {
            res.end(JSON.stringify(data));
        });
    });
});

app.get("/delete_series", function(req, res) {
    let query = req.query;
    safeDoAction(req, res, function() {
        db.delete_series(query.seriesId, function(data) {
            res.end(JSON.stringify(data));
        });
    });
});

app.get("/delete_prop", function(req, res) {
    let query = req.query;
    safeDoAction(req, res, function() {
        db.delete_prop(query.propId, function(data) {
            res.end(query.propId);
        });
    });
});

app.post("/update_prop", objMulter.single('imageUrl'), function(req, res) {
    var data = {
        id: req.body.id,
        propName: req.body.propName,
        propDesc: req.body.propDesc,
        costPropId: req.body.costPropId,
        costAmount: req.body.costAmount,
    }
    if (req.file) {
        var sourceFile = req.file.path;
        var imageUrl = "\\" + sourceFile.substr(sourceFile.indexOf("img"));
        data.imageUrl = imageUrl.split("\\").join("/");
        logger.admin_log("图片保存路径", data.imageUrl);
    }
    
    // let query = req.query;
    safeDoAction(req, res, function() {
        db.update_prop(data, function(data) {
            res.end(JSON.stringify(data));
        });
    });
});

app.post('/add_prop', objMulter.single('imageUrl'), function (req, res, next) {
    // var fileName = req.file.filename;
    var data = {
        propName: req.body.propName,
        propDesc: req.body.propDesc,
        costPropId: req.body.costPropId,
        costAmount: req.body.costAmount,
    }
    if (req.file) {
        var sourceFile = req.file.path;
        var imageUrl = "\\" + sourceFile.substr(sourceFile.indexOf("img"));
        data.imageUrl = imageUrl.split("\\").join("/");
        logger.admin_log("图片保存路径", data.imageUrl);
    }
    
    safeDoAction(req, res, function() {
        db.add_prop(data, function(data) {
            res.setHeader('Content-Type','text/html;charset=utf-8');
            fs.createReadStream(`${webRootPath}/prop.html`).pipe(res);
            // fs.createReadStream(`${webRootPath}/mall.html`).pipe(res);
        });
    });
});

app.post("/add_series", function(req, res) {
    var data = req.body;
    safeDoAction(req, res, function() {
        if (data.originalPrice == null) {
            data.originalPrice = data.presentPrice;
        }
        db.add_shop_series(data, function(data) {
            res.setHeader('Content-Type','text/html;charset=utf-8');
            fs.createReadStream(`${webRootPath}/series.html`).pipe(res);
            // fs.createReadStream(`${webRootPath}/mall.html`).pipe(res);
        });
    });
});

app.post("/add_game_cost", function(req, res) {
    var data = req.body;
    safeDoAction(req, res, function() {
        // data.gameType = gameTypeTable[data.gameType] || data.gameType;
        db.add_game_cost(data, function(data) {
            res.setHeader('Content-Type','text/html;charset=utf-8');
            fs.createReadStream(`${webRootPath}/game_cost.html`).pipe(res);
            // fs.createReadStream(`${webRootPath}/mall.html`).pipe(res);
        });
    });
});

app.get("/update_game_cost", function(req, res) {
    var data = req.query;
    safeDoAction(req, res, function() {
        // data.gameType = gameTypeTable[data.gameType] || data.gameType;
        db.update_game_cost(data, function(data) {
            res.setHeader('Content-Type','text/html;charset=utf-8');
            res.end();
            // fs.createReadStream(`${webRootPath}/mall.html`).pipe(res);
        });
    });
});

app.get("/delete_game_cost", function(req, res) {
    let query = req.query;
    safeDoAction(req, res, function() {
        db.delete_game_cost(query.costId, function(data) {
            res.end(query.costId);
        });
    });
});

app.get("/get_all_order", function(req, res) {
    safeDoAction(req, res, function() {
        db.get_all_order(function(data) {
            res.end(JSON.stringify(data));
        });
    });
});

app.get("/get_user_amount", function(req, res) {
    safeDoAction(req, res, function() {
        db.get_user_amount(function(data) {
            res.end(JSON.stringify(data));
        });
    });
});

app.get("/get_total_order_pay", function(req, res) {
    safeDoAction(req, res, function() {
        db.get_total_order_pay(function(data) {
            res.end(JSON.stringify(data));
        });
    });
});

app.get("/get_all_game_cost", function(req, res) {
    safeDoAction(req, res, function() {
        db.get_all_game_cost(function(data) {
            res.end(JSON.stringify(data));
        });
    });
});

app.get("/add_gem", function(req, res) {
    var gemData = {
        userId: req.query.userId,
        gem: req.query.gem,
    };
    safeDoAction(req, res, function() {
        db.add_gem(gemData, function(data) {
            res.end(JSON.stringify(data));
        });
    });
});

app.get("/get_all_record", function(req, res) {
    let userId = req.query.userId;
    safeDoAction(req, res, function() {
        db.get_user_record({ userId: userId }, function(data) {
            res.end(JSON.stringify(data));
        });
    });
});

app.post("/login", function(req, res) {
    let query = req.body;
    var account = query.account;
    var password = query.password;
    db.is_admin(account, password, function(isAdmin) {
        if (isAdmin) {
            res.setHeader('Content-Type','text/html;charset=utf-8');
            fs.createReadStream(`${webRootPath}/dashboard.html`).pipe(res);
        } else {
            fs.readFile(`${webRootPath}/index.html`, (error, html) => {
                if (error) {
                    logger.admin_log(error);
                    res.end("server error");
                    return;
                }
                res.writeHead(200,{'Content-Type':'text/html'});
                html += "<script>var msg='用户名密码不正确';</script>"
                res.end(html);
            });
        }
    })
});

app.use(function(req, res, next) {
    const { pathname } = url.parse(req.url, true);
    const query = req.query;
    LogUtil.debug("通配路径", pathname);
    let filePath = `${webRootPath}${pathname}`;
    if (fs.existsSync(filePath)) {
        let stat = fs.lstatSync(filePath);
        if (stat.isDirectory()) {
            next();
        } else {
            res.setHeader('Content-Type', mime.lookup(pathname) +';charset=utf-8');
            if (filePath.endsWith(".html")) {
                res.write(`<script type="text/javascript" charset="utf-8">\n`);
                res.write(`var query = {};\n`);
                for (let key in query) {
                    res.write(`query.${key}="${query[key]}";\n`);
                }
                res.write(`</script>\n`);
            }
            fs.createReadStream(filePath).pipe(res);
        }
    } else {
        next();
        // logger.admin_log("错误的访问", req.url);
        // res.statusCode=404;
        // res.end();
    }
});

function checkPermission() {
    return true;
}

function safeDoAction(req, res, callback) {
    if (checkPermission()) {
        callback(req, res);
    } else {
        res.end("没有管理员权限");
    }
}

