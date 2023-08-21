import PlayPokerCardPointMgr, { CARD_TYPE } from "../Base/PlayPokerCardPointMgr";

export default class PDKCardPointMgr extends PlayPokerCardPointMgr {

    static isStraight(cards: number[]) {
        return super.isStraight(cards, true);
    }

    static isSingleStraight(cards: number[]) {
        let cnt = this.getSameCardValueCnt(cards);
        return cnt[1] == cards.length && cnt[1] >= 5 && this.isStraight(cards);
    }

    static isPairStraight(cards: number[]) {
        let cnt = this.getSameCardValueCnt(cards);
        return cnt[2] * 2 == cards.length && cnt[2] >= 2 && this.isStraight(cards);
    }

    static getBombValue(cards: number[]) {
        if (this.isLeopard(cards)) {
            if (cards.length == 4) {
                return 1000 * this.getCardPoint(cards[0]);
            }
            if (cards.length == 3 && this.getCardValue(cards[0]) == 1) {
                return 500;
            }
        }
        return 0;
    }

    static isBomb(cards: number[]) {
        if (this.isLeopard(cards)) {
            if (cards.length >= 4) {
                return true;
            }
            if (cards.length == 3 && this.getCardValue(cards[0]) == 1) {
                return true;
            }
        }
        return false;
    }

    static findBomb(holds: number[]) {
        let amount = this.parseCardPointAmountTable(holds);
        if (amount[3] && amount[3].indexOf(14) >= 0) {
            return this.findCards(holds, [14], 3);
        }
        if (amount[4]) {
            return this.findCards(holds, [amount[4][0]], 4);
        }
    }

    static getLegalCardTypes() {
        return [
            CARD_TYPE.BOMB,
            CARD_TYPE.SINGLE,
            CARD_TYPE.PAIR,
            CARD_TYPE.THREE,
            CARD_TYPE.SINGLE_STRAIGHT,
            CARD_TYPE.PAIR_STRAIGHT,
            CARD_TYPE.THREE_STRAIGHT,
            CARD_TYPE.THREE_BELT_ONE,
            CARD_TYPE.THREE_BELT_PAIR,
            CARD_TYPE.THREE_STRAIGHT_BELT_ONE,
            CARD_TYPE.THREE_STRAIGHT_BELT_PAIR,
            CARD_TYPE.FOUR_BELT_TWO,
            CARD_TYPE.FOUR_BELT_TWO_PAIR,
        ]
    }

}