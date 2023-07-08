import BaseServer from "../base_net/BaseServer";
import LoginHttp from "./LoginHttp";


export default class LoginServer extends BaseServer {
    
    launch() {
        this.initServer();
        this.listen();
    }

    getPort() {
        return 8002;
    }

    onHttpMessage(req: any, res: any, path: any, query: any) {
        LoginHttp.onMessage(req, res, path, query);
    }
}