import GameUtil from "../../../../../utils/GameUtil";
import CardMgr from "../../../../Game/CardMgr";

export default class SSSCardMgr extends CardMgr {

    constructor(playerNum: number) {
        super();
        if (playerNum > 4) {
            this.cardHeap = GameUtil.mergeList(this.generateCards(), this.cardHeap);
        }
    }
    
}