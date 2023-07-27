import CardMgr from "../../../Game/CardMgr";
import PlayPokerCardPointMgr from "./PlayPokerCardPointMgr";


export default class PlayPokerCardMgr extends CardMgr {
        
    sortCard(holds: number[], huns: number[] = []) {
        holds.sort(PlayPokerCardPointMgr.isBetterCard.bind(PlayPokerCardPointMgr));
    }
}