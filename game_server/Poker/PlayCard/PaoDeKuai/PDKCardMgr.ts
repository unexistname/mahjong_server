import { PokerCardDecor } from "../../Base/PokerCardDecor";
import PlayPokerCardMgr from "../Base/PlayPokerCardMgr";


export default class PDKCardMgr  extends PlayPokerCardMgr {

    constructor(playerNum: number) {
        super();
        if (playerNum == 4) {
            this.cardHeap = super.generateCards();
        }
    }

    generateCards() {
        let cards = [];
        for (let i = 3; i <= 13; ++i) {
            cards.push(this.createPokerCard(PokerCardDecor.HEART, i));
            cards.push(this.createPokerCard(PokerCardDecor.BLOCK, i));
            cards.push(this.createPokerCard(PokerCardDecor.SPADE, i));
            cards.push(this.createPokerCard(PokerCardDecor.PLUM, i));
        }
        cards.push(this.createPokerCard(PokerCardDecor.HEART, 1));
        cards.push(this.createPokerCard(PokerCardDecor.BLOCK, 1));
        cards.push(this.createPokerCard(PokerCardDecor.SPADE, 1));
        cards.push(this.createPokerCard(PokerCardDecor.PLUM, 2));
        return cards; 
    }
    
}