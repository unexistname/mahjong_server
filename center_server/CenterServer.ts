import BaseServer from "../base_net/BaseServer";
import CenterHttp from "./CenterHttp";

const fs = require('fs');
const mime = require("mime");

export default class CenterServer extends BaseServer {

    launch() {
        this.initServer();
        this.listen();
    }

    getPort() {
        return 8001;
    }

    onHttpMessage(req: any, res: any, path: any, query: any) {
        if (fs.existsSync(`../${path}`)) {
            res.setHeader('Content-Type', mime.lookup(path) +';charset=utf-8');
            fs.createReadStream(`../${path}`).pipe(res);
        } else {
            CenterHttp.onMessage(req, res, path, query);;
        }
    }
}