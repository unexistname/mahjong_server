import CardMgr from "../../Game/CardMgr";
import MJCardMgr from "../Base/MJCardMgr";


export default class QSCardMgr extends MJCardMgr {

    generateCards(): number[] {
        let cards = [];
        for (let i = 0; i < 34; ++i) {
            for (let j = 0; j < 4; ++j) {
                cards.push(i);
            }
        }
        return cards;
    }
}