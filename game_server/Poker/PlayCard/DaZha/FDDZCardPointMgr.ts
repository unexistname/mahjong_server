import { PokerCardDecor } from "../../Base/PokerCardDecor";
import PlayPokerCardPointMgr, { CARD_TYPE } from "../Base/PlayPokerCardPointMgr";


export default class FDDZCardPointMgr extends PlayPokerCardPointMgr {

    static getLegalCardTypes() {
        return [
            CARD_TYPE.BOMB,
            CARD_TYPE.SINGLE,
            CARD_TYPE.PAIR,
            CARD_TYPE.THREE,
            CARD_TYPE.SINGLE_STRAIGHT,
            CARD_TYPE.PAIR_STRAIGHT,
            CARD_TYPE.THREE_STRAIGHT,
        ]
    }

    static is510K(cards: number[]) {
        if (cards.length != 3) {
            return false;
        }
        let dict = this.parseCardPointTable(cards);
        return dict[5] && dict[10] && dict[13];
    }

    static isGhostBomb(cards: number[]) {
        if (cards.length > 8) {
            return false;
        }
        let dict = this.parseCardDecorTable(cards);
        if (!dict[PokerCardDecor.GHOST]) {
            return false;
        }
        if (dict[PokerCardDecor.GHOST] == cards.length && cards.length >= 3) {
            return true;
        }

        let commonCardAmount = cards.length - dict[PokerCardDecor.GHOST];
        if (commonCardAmount < 3) {
            // 至少三个相同的牌才能配鬼牌
            return false;
        }
        dict = this.parseCardPointTable(cards);
        for (let i in dict) {
            if (dict[i] == commonCardAmount) {
                return true;
            }
        }
        return false;
    }

    static isSingleStraight(cards: number[]) {
        let cnt = this.getSameCardValueCnt(cards);
        return cnt[1] == cards.length && cnt[1] == 5 && this.isStraight(cards);
    }

    static isBomb(cards: number[]) {
        if (this.is510K(cards)) {
            return true;
        }
        if (this.isGhostBomb(cards)) {
            return true;
        }
        if (this.isCommonBomb(cards)) {
            return true;
        }
        return false;
    }

    static getBombValue(cards: number[]) {
        if (this.is510K(cards)) {
            if (this.isSameDecor(cards)) {
                let decorPoint = 4 - this.getCardDecor(cards[0]);
                return 200 + decorPoint;
            } else {
                return 100;
            }
        } else if (this.isLeopard(cards)) {
            if (this.isGhost(cards[0])) {
                if (cards.length == 3) {
                    return 6000;
                } else if (cards.length == 4) {
                    return 7000;
                }
            } else {
                let point = this.getCardPoint(cards[0]);
                return cards.length * 1000 + point;
            }
        } else if (this.isGhostBomb(cards)) {
            cards.sort(this.isBetterCard.bind(this));
            let point = this.getCardPoint(cards[cards.length - 1]);
            return cards.length * 1000 + point;
        }
        return 0;
    }

    static getBonusFactor(cards: number[]) {
        let bombLen = cards.length;
        if (this.isLeopard(cards)) {
            if (this.isGhost(cards[0])) {
                if (bombLen >= 3) {
                    return 1 << (bombLen - 2);
                }
            } else if (this.getCardPoint(cards[0]) == 15) {
                if (bombLen >= 4) {
                    return 1 << (bombLen - 4);
                }
            } else if (bombLen >= 5) {
                return 1 << (bombLen - 5);
            }
        } else {
            if (bombLen >= 5) {
                let dict = this.parseCardPointTable(cards);
                for (let point in dict) {
                    let amount = dict[point];
                    if (Number(point) < 16) {
                        if (Number(point) == 15) {
                            if (amount >= 4) {
                                return 1 << (amount - 4);
                            }
                        } else {
                            if (amount >= 5) {
                                return 1 << (amount - 5);
                            }
                        }
                    }
                }
            }
        }
        return 0;
    }
}