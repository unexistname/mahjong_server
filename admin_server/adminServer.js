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


var gameTypeTable = {
    "钓蟹": "pk_dx",
    "牛牛": "wd_nn",
    "炸金花": "pk_zjh",
    "三公": "pk_sg",
    "十三水": "pk_sss",
    "德州扑克": "pk_dz",
    "宁德麻将": "mj_nd",
    "福鼎麻将": "mj_fd",
};

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

// http.createServer((req, res) => {
//     logger.admin_log("req.url =", req.url);
//     const { pathname, query } = url.parse(req.url, true)
//     logger.admin_log(pathname, query);

//     if (pathname === "/") {
//         res.setHeader('Content-Type','text/html;charset=utf-8');
//         fs.createReadStream(`${webRootPath}/index.html`).pipe(res);
//     } else if (fs.existsSync(`${webRootPath}${pathname}`)) {
//         res.setHeader('Content-Type', mime.lookup(pathname) +';charset=utf-8');
//         fs.createReadStream(`${webRootPath}${pathname}`).pipe(res);
//     } else if (pathname == "/upload") {
//         upload(req, res);
//     } else if (pathname == "/login") {
//         login(req, res);
//     } else if (pathname == "/get_all_user_info") {
//         getAllUserInfo(req, res);
//     } else if (pathname == "/get_all_user_permission") {
//         getAllUserPermission(req, res);
//     } else if (pathname == "/set_user_black") {
//         setUserBlack(req, res, query);
//     } else if (pathname == "/set_user_permission") {
//         setUserPermission(req, res, query);
//     } else if (pathname == "/get_all_prop") {
//         getAllProp(req, res);
//     } else if (pathname == "/get_all_series") {
//         getAllSeries(req, res);
//     }else if (pathname == "/delete_prop") {
//         deleteProp(req, res, query);
//     } else if (pathname == "/add_prop") {
//         addProp(req, res, query);
//     } else if (pathname == "/get_all_order") {
//         getAllOrder(req, res);
//     } else if (pathname == "/get_user_amount") {
//         getUserAmount(req, res);
//     } else if (pathname == "/get_total_order_pay") {
//         getTotalOrderPay(req, res);
//     } else if (pathname == "/get_all_game_cost") {
//         getAllGameCost(req, res);
//     } else {
//         logger.admin_log("错误的访问", req.url);
//         res.statusCode=404;
//         res.end();
//     }
// }).listen(7030);

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
    const { pathname, query } = url.parse(req.url, true);
    logger.admin_log("通配路径", pathname);
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
        // logger.admin_log("错误的访问", req.url);
        // res.statusCode=404;
        // res.end();
    }
});

function upload(req, res) {
    var uploadPath = webRootPath + "/img/";
    var form = multiparty.Form({uploadDir: uploadPath});
    form.encoding = "utf-8";
    form.maxFileSize = 100 * 1024 * 1024;
    form.parse(req, function(err, fields, files) {
		var fileName = (files.file[0]).originalFilename;
		var filePath = (files.file[0]).path;
		var newFilePath = uploadPath + fileName;
        logger.admin_log("上传文件", fileName, filePath, newFilePath);
    });
}

function login(req, res) {
    dealPostFunc(req, function(postData) {
        logger.admin_log(postData.account);
        logger.admin_log(postData.password);
        var account = postData.account;
        var password = postData.password;
        db.is_admin(account, password, function(isAdmin) {
            if (isAdmin) {
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
}

function setUserBlack(req, res, query) {
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
}

function setUserPermission(req, res, query) {
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
}

function getAllUserInfo(req, res) {
    safeDoAction(req, res, function() {
        db.get_all_user_info(function(datas) {
            // logger.admin_log("所有用户数据",datas);
            res.end(JSON.stringify(datas));
        });
    });
}

function getAllUserPermission(req, res) {
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
}

function getAllProp(req, res) {
    safeDoAction(req, res, function() {
        db.get_all_prop(function(datas) {
            res.end(JSON.stringify(datas));
        });
    });
}

function getAllSeries(req, res) {
    safeDoAction(req, res, function() {
        db.get_all_series(function(datas) {
            res.end(JSON.stringify(datas));
        });
    });
}

function deleteProp(req, res, query) {
    safeDoAction(req, res, function() {
        db.delete_prop(query.propId, function(data) {
            res.end(query.propId);
        });
    });
}

function addProp(req, res, query) {
    dealPostFunc(req, function(postData) {
        logger.admin_log("添加道具", postData.propName);
        safeDoAction(req, res, function() {
            db.add_prop(postData, function(data) {
                res.setHeader('Content-Type','text/html;charset=utf-8');
                fs.createReadStream(`${webRootPath}/prop.html`).pipe(res);
                // fs.createReadStream(`${webRootPath}/mall.html`).pipe(res);
            });
        });
    });
}

function getAllOrder(req, res) {
    safeDoAction(req, res, function() {
        db.get_all_order(function(data) {
            res.end(JSON.stringify(data));
        });
    });
}

function getAllGameCost(req, res) {
    safeDoAction(req, res, function() {
        db.get_all_game_cost(function(data) {
            res.end(JSON.stringify(data));
        });
    });
}

function getUserAmount(req, res) {
    safeDoAction(req, res, function() {
        db.get_user_amount(function(data) {
            logger.admin_log(data);
            res.end(JSON.stringify(data));
        });
    });
}

function getTotalOrderPay(req, res) {
    safeDoAction(req, res, function() {
        db.get_total_order_pay(function(data) {
            logger.admin_log(data);
            res.end(JSON.stringify(data));
        });
    });
}

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

