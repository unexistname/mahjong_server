import CardMgr from "../Game/CardMgr";
import { GameConst } from "../GameConst";
import { PokerCardDecor } from "../Poker/PokerCardDecor";


export default class DXCardMgr extends CardMgr {
    
    generateCards() {
        let cards = [];
        for( let i = 2; i <= 12; i ++ ){
            if (i == 3) continue;
            cards.push(this.createPokerCard(PokerCardDecor.HEART, i));
            cards.push(this.createPokerCard(PokerCardDecor.BLOCK, i));
        }
        for( let i = 3; i <= 10; i ++ ){
            if (i == 5 || i == 9) continue;
            cards.push(this.createPokerCard(PokerCardDecor.SPADE, i));
            if (i == 3) continue;
            cards.push(this.createPokerCard(PokerCardDecor.PLUM, i));
        }
        cards.push(this.createPokerCard(PokerCardDecor.GHOST, 2));  // 大王
        return cards;
    }
}