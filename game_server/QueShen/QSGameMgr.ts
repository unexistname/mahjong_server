import GameUtil from "../../utils/GameUtil";
import MJGameMgr from "../Majhong/MJGameMgr";


export default class QSGameMgr extends MJGameMgr {

    canChi: boolean = false;

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
        this.generateHun();
        
        this.net.G_DecideBanker(this.bankerId, this.getGamberIds());
        this.nextState();
    }
}