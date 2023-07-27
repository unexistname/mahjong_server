import LogUtil from "../../../utils/LogUtil";
import GamberModel from "../../Game/GamberModel";
import { GameConst } from "../../GameConst";

export default class MJGamberModel extends GamberModel {
    // 玩家持有的花牌
    flowers: number[] = [];
    //打出的牌
    folds: number[] = [];
    //暗杠的牌
    penggangs: any = [];
    //玩家手上的牌的数目，用于快速判定碰杠
    countMap: { [key: number]: number } = {};
    //玩家听牌，用于快速判定胡了的番数
    tingMap: number[] = [];
    pattern = GameConst.HuType.NONE;

    // 风向
    direction: number = 0;

    //是否可以杠
    canGang = false;
    //用于记录玩家可以杠的牌
    gangPai: number[] = [];

    canChi = false;
    chiPai: any[] = [];
    //是否可以碰
    canPeng = false;
    //是否可以胡
    canHu = false;
    //是否可以出牌
    canChuPai = false;

    guoHuTime = 0;

    winTypes: GameConst.HuType[] = [];

    //是否胡了
    hued = false;
    //是否是自摸
    iszimo = false;
    isGangHu = false;
    score = 0;
    lastFangGangSeat = -1;

    ruleData: any = null;
    
    reset() {
        super.reset();
        this.flowers = [];
        this.folds = [];
        this.penggangs = [];
        this.countMap = {};
        this.tingMap = [];
        this.pattern = GameConst.HuType.NONE;
        this.canGang = false;
        this.gangPai = [];
        this.canChi = false;
        this.chiPai = [];
        this.canPeng = false;
        this.canHu = false;
        this.canChuPai = false;
        this.guoHuTime = 0;
        this.winTypes = [];
        this.hued = false;
        this.ruleData = null;
    }

    addCard(card: number): void {
        if (card == -1) {
            LogUtil.error("加牌有误", this.userId, card);
            return
        }
        this.holds.push(card);
        if (this.countMap[card]) {
            this.countMap[card] += 1;
        } else {
            this.countMap[card] = 1;
        }
    }

    discard(card: number) {
        let index = this.holds.indexOf(card);
        if (index >= 0) {
            this.holds.splice(index, 1);
            this.countMap[card] -= 1;
            if (this.countMap[card] <= 0) {
                delete this.countMap[card]
            }
            return card;
        }
    }

    popCard() {
        let card = this.holds.pop();
        if (card != null) {
            this.countMap[card] -= 1;
            if (this.countMap[card] <= 0) {
                delete this.countMap[card]
            }
        }
        return card || -1;
    }
}