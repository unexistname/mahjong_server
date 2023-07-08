import RoomMetaConfModel, { RoomCommonConfModel, RoomRuleConfModel } from "./RoomMetaConfModel";

const db = require("../../utils/db");

export default class RoomMetaConfMgr {
    private static _ins: RoomMetaConfMgr;
    static get ins() {
        if (this._ins == null) {
            this._ins = new RoomMetaConfMgr();
        }
        return this._ins;
    }

    metaConfs: { [key: string]: RoomMetaConfModel } = {};

    getAllMetaConf() {
        return this.metaConfs;
    }

    loadAllMetaConf() {
        db.get_all_game_cost((costs: any[]) => {
            for (let costData of costs) {
                db.get_game_config(costData.id, (dao: any) => {
                    let metaConf = new RoomMetaConfModel();
                    metaConf.gameName = costData.gameType;
                    metaConf.costType = costData.costPropId;
                    metaConf.costNum = costData.costPropAmount;
                    let commonConfs = [];
                    for (let conf of dao.commonConfs) {
                        let commonConf = new RoomCommonConfModel();
                        for (let valueData of conf.values) {
                            commonConf.values.push(valueData.value);
                        }
                        commonConf.name = conf.name;
                        commonConf.show = conf.show;
                        commonConfs.push(commonConf);
                    }
                    let ruleConfs = [];
                    for (let conf of dao.ruleConfs) {
                        let ruleConf = new RoomRuleConfModel();
                        ruleConf.name = conf.name;
                        ruleConf.show = conf.show;
                        ruleConfs.push(ruleConf);
                    }
                    metaConf.commonConfs = commonConfs;
                    metaConf.ruleConfs = ruleConfs;
                    this.metaConfs[metaConf.gameName] = metaConf;
                });
            }
        });
    }

    getConf(gameName: string) {
        return this.metaConfs[gameName];
    }
}