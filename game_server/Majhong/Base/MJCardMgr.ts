import CardMgr from "../../Game/CardMgr";


export default class MJCardMgr extends CardMgr {

    generateCards() {
        let cards = [];
        for (let i = 0; i < 34; ++i) {
            for (let j = 0; j < 4; ++j) {
                cards.push(i);
            }
        }
        for (let i = 34; i < 42; ++i) {
            cards.push(i);
        }
        return cards;
    }
}