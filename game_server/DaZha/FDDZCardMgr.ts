import CardMgr from "../Game/CardMgr";
import { PokerCardDecor } from "../Poker/PokerCardDecor";
import FDDZCardPointMgr from "./FDDZCardPointMgr";


export default class FDDZCardMgr extends CardMgr {
    
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

    sortCard(holds: number[], huns: number[] = []) {
        holds.sort(FDDZCardPointMgr.isBetterCard.bind(FDDZCardPointMgr));
    }
}