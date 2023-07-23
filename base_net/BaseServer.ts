import { IncomingMessage } from "http";
import LogUtil from "../utils/LogUtil";
import BaseSocket from "./BaseSocket";

const WebSocket = require('ws');
const socket = require('../base_net/socket');
const express = require('express');
const http2 = require('http');
const url = require('url');


export default class BaseServer {
    app: any;
    server: any;
    wss: any;

    launch() {
        this.initServer();
        this.initSocket();
        this.listen();
    }

    initServer() {
        this.app = express();
        this.app.all('*', (req: any, res: any, next: any) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "X-Requested-With");
            res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
            res.header("X-Powered-By",' 3.2.1');
            res.header("Content-Type", "application/json;charset=utf-8");
            next();
        });
        this.app.use((req: any, res: any) => {
            const { pathname } = url.parse(req.url, true);
            const query = req.query;
            this.onHttpMessage(req, res, pathname, query);
        });

        this.server = http2.createServer(this.app);
    }

    initSocket() {
        let server = this.server;
        this.wss = new WebSocket.Server({ server });

        this.wss.on('open', () => {
            LogUtil.debug(`[${this.constructor.name} open]`);
        });
        this.wss.on('close', () => {
            LogUtil.debug(`[${this.constructor.name} close]`);
        });
        this.wss.on('connection', (ws: any, req: IncomingMessage) => {
            ws.on('message', (message: any) => {
                message = socket.parse(message);
                if (message == null) {
                    LogUtil.warn(`[${this.constructor.name} receive empty message] ${ws.userId}`);
                } else if (BaseSocket.isHeartBeatCmd(message.cmd)) {
                    BaseSocket.heartBeat(ws);
                } else if (BaseSocket.isConnectCmd(message.cmd)) {
                    this.onWSConnect(ws, req, message);
                } else {
                    this.onWSMessage(ws, req, message);
                }
            });
            ws.on('close', (code: number, reason: any) => {
                this.onWSClose(ws, code, reason);
            });
            ws.on("error", (error: any, code: any) => {
                LogUtil.error(`[${this.constructor.name} Socket error]: ${ws.userId}, ${error}, ${code}`);
            });
        });
    }

    listen() {
        this.server.listen(this.getPort(), () => {
            LogUtil.debug(`[${this.constructor.name} Listen] Listening on ${this.server.address().port}`);
        });
    }

    getPort() {
        return 0;
    }

    onHttpMessage(req: any, res: any, path: any, query: any) {

    }

    onWSConnect(ws: any, req: IncomingMessage, message: any) {

    }

    onWSMessage(ws: any, req: IncomingMessage, message: any) {

    }

    onWSClose(ws: any, code: number, reason: any) {

    }
}