'use strict';
//
exports.servers =
    {
        "center_login": {
            "hotUpdate": {
                "1.0.0": { "isHot": 1,"hotUrl": "http://127.0.0.1:8899/hotupdate"}
            },
            "version": "1.0.0",
            "servers": [//loginserver                         
                { "index": 1,"desc": "麻将1服", "name":"内测版","url": "127.0.0.1:8002", "token": "fKhxfw/cwLE2ok2VrqmV9w==" },
            ],
            "recommend": 1
        },
        "login_hall": {
            "servers"://hall_server
                { "index": 1,"desc": "麻将1服", "url": "127.0.0.1:8003","weChat":"", "shareWeb": "" }
        },
        "hall_game": {
            "servers":
                { "index": 1, "desc": "麻将1服", "url": "127.0.0.1:9001" }
        }
    }