import GameUtil from "../../../utils/GameUtil";
import CardMgr from "../../Game/CardMgr";
import { GameConst } from "../../GameConst";
import MJGamberModel from "../Base/MJGamberModel";
import MJGameMgr from "../Base/MJGameMgr";
import QSCardMgr from "./QSCardMgr";
import QSCardPointMgr from "./QSCardPointMgr";


export default class QSGameMgr extends MJGameMgr {

    canChi: boolean = false;
    banJiangs: number[] = [1, 4, 7, 10, 13, 16, 19, 22, 25];

    State_decideBanker() {
        if (this.bankerId == null) {
            this.wind = GameUtil.random(this.gamberNum - 1);
            this.net.G_DecideWind(this.gambers[this.wind].userId);
            this.banker = this.gambers[this.wind];
            this.bankerId = this.banker.userId;
            this.bankerTimes = 1;
        } else {
            for (let gamber of this.gambers) {
                if (gamber.userId == this.bankerId) {
                    this.banker = gamber;
                    break;
                }
            }
        }
                
        this.net.G_DecideBanker(this.bankerId, this.getGamberIds());
        this.nextState();
    }

    updateCanHu(gamber: MJGamberModel, targetCard: number) {
        gamber.pattern = QSCardPointMgr.getHuPattern(this, gamber, targetCard);
        gamber.canHu = gamber.pattern != GameConst.HuType.NONE;
    }
    
    settle(): void {
        for (let gamber of this.gambers) {
            if (gamber.hued) {
                this.changeGamberScore(gamber, this.baseScore * (this.gamberNum - 1));
            } else {
                this.changeGamberScore(gamber, -this.baseScore);
            }
        }
        for (let gamber of this.gambers) {
            if (gamber.hued) {
                this.winnerId = gamber.userId;
                break;
            }
        }
    }

    generateCardMgr(): CardMgr {
        return new QSCardMgr();
    }
}