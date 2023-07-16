

import CenterServer from './center_server/CenterServer';
import LoginServer from './login_server/LoginServer';
import HallServer from './hall_server/HallServer';
import GameServer from "./game_server/GameServer";

var centerServer = new CenterServer();
var loginServer = new LoginServer();
var hallServer = new HallServer();
var gameServer = new GameServer();

centerServer.launch();
loginServer.launch();
hallServer.launch();
gameServer.launch();
var adminServer = require('./admin_server/adminServer');
var downloadServer = require('./download_server/downloadServer');


const { default: LogUtil } = require('./utils/LogUtil');
process.on('uncaughtException', (err) => {
    LogUtil.error("[Launch Error]" + ' Caught exception: ' + err.stack);
});