import BaseHttp from "../base_net/BaseHttp";
import { ErrorCode } from "../game_server/ErrorCode";

const config = require('../common/config');

export default class CenterHttp extends BaseHttp {

    private static _config_version: { [key: string] : any };
    private static _config_servers: { [key: string] : any };
    
    static getVersionConfig() {
        if (!this._config_version) {
            this._config_version = {};
            let data = config.servers.center_login;
            this._config_version.hotUpdate = data.hotUpdate;
            this._config_version.version = data.version;
        }
        return this._config_version;
    }
    
    static getServerConfig() {
        if (!this._config_servers) {
            this._config_servers = {};
            let data = config.servers.center_login;
            this._config_servers.servers = data.servers;
            this._config_servers.recommend = data.recommend;
            this._config_servers.debug = data.debug;
        }
        return this._config_servers;
    }

    static getServers() {
        return this.getServerConfig().servers;
    }

    static getRecommendServer() {
        return this.getServerConfig().recommend;
    }

    static C_GetVersion(res: any, msg: any) {
        if (!this.getVersionConfig().hotUpdate) {
            return;
        }
        let ret: any = {};
        let ver = msg.version;
        ret.hotUpdate = this.getVersionConfig().hotUpdate[ver];
        ret.version = this.getVersionConfig().version;
        this.send(res, ret);
    }

    static C_GetServers(res: any, msg: any) {
        if (!this.getServers()) {
            return;
        }
        let max_servers = Number(msg.max_servers) || 0;
        if (max_servers <= this.getServers().length) {
            let servers = [];
            for (let i = max_servers; i < this.getServers().length; i++) {
                let server = this.getServers()[i];
                servers.push({index:server.index,desc:server.desc,name:server.name});
            }
            let data = {
                servers: servers,
                recommend: this.getRecommendServer(),
                debug: this.getServerConfig().debug
            }
            this.send(res, data);
        } else {
            this.sendError(res, ErrorCode.REQUEST_SERVER_ARGUMENT_ERROR);
        }
    }

    static C_GetAddress(res: any, msg: any) {
        if (!this.getServers()) {
            return;
        }
        let index = parseInt(msg.index);
        if (isNaN(index)) {
            this.sendError(res, ErrorCode.REQUEST_SERVER_ADDRESS_ERROR);
        } else {
            let data = {};
            let info = this.getServers()[index - 1];
            if (info) {
                data = {
                    index: info.index,
                    url: info.url,
                    token: info.token
                }
            }
            this.send(res, data);
        }
    }
}