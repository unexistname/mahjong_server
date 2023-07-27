import CardMgr from "../../../Game/CardMgr";
import { PokerCardDecor } from "../../Base/PokerCardDecor";
import PlayPokerCardMgr from "../Base/PlayPokerCardMgr";
import PDKCardPointMgr from "./PDKCardPointMgr";


export default class PDKCardMgr  extends PlayPokerCardMgr {
    
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