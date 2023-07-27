import CardMgr from "../../../Game/CardMgr";
import { PokerCardDecor } from "../../Base/PokerCardDecor";
import PlayPokerCardMgr from "../Base/PlayPokerCardMgr";
import FDDZCardPointMgr from "./FDDZCardPointMgr";


export default class FDDZCardMgr extends PlayPokerCardMgr {
    
    generateCards() {
        let cards = [];
        for (let k = 0; k < 2; ++k) {
            for (let i = 1; i <= 13; ++i) {
                cards.push(this.createPokerCard(PokerCardDecor.HEART, i));
                cards.push(this.createPokerCard(PokerCardDecor.BLOCK, i));
                cards.push(this.createPokerCard(PokerCardDecor.SPADE, i));
                cards.push(this.createPokerCard(PokerCardDecor.PLUM, i));
            }
            cards.push(this.createPokerCard(PokerCardDecor.GHOST, 1));  // 小王
            cards.push(this.createPokerCard(PokerCardDecor.GHOST, 2));  // 大王
        }
        return cards; 
    }

}