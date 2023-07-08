
export default class RoomMetaConfModel {

    gameName: string;
    costType: number;
    costNum: number;

    commonConfs: RoomCommonConfModel[];
    ruleConfs: RoomRuleConfModel[];

    getPartDefaultConf() {
        let data: { [key: string]: any } = {};
        for (let conf of this.commonConfs) {
            if (!conf.show && conf.values.length > 0) {
                data[conf.name] = conf.values[0];
            }
        }
        for (let conf of this.ruleConfs) {
            if (!conf.show) {
                data[conf.name] = true;
            }
        }
        return data;
    }
}

export class RoomCommonConfModel {
    name: string;
    values: any[] = [];
    show: boolean = true;
}

export class RoomRuleConfModel {
    name: string;
    show: boolean = true;
}