import { PokerCardDecor } from "../Poker/PokerCardDecor";
import PokerCardPointMgr from "../Poker/PokerCardPointMgr";

export enum CARD_TYPE {
    NONE,
    SINGLE,
    PAIR,
    THREE,
    SINGLE_STRAIGHT,
    PAIR_STRAIGHT,
    THREE_STRAIGHT,
    BOMB,
}

export default class FDDZCardPointMgr extends PokerCardPointMgr {
    static isLegal(cards: number[]) {
        return this.getCardType(cards) != CARD_TYPE.NONE;
    }

    static getCardPoint(card: number) {
        let decor = this.getCardDecor(card);
        let value = this.getCardValue(card);
        if (decor == PokerCardDecor.GHOST) {
            return value + 15;
        }
        return value < 3 ? value + 13 : value;
    }
    
    // 豹子
    static isLeopard(cards: number[]) {
        let firstValue;
        for (let card of cards) {
            let value = this.getCardPoint(card);
            if (value == 17) value = 16;    // 兼容大小王
            if (firstValue == null) {
                firstValue = value;
            } else if (value != firstValue) {
                return false;
            }
        }
        return true;
    }

    static isPair(cards: number[]) {
        if (cards.length == 2 && this.isLeopard(cards)) {
            return true;
        }
        return false;
    }

    static getCardType(cards: number[]) {
        if (cards.length == 1) {
            return CARD_TYPE.SINGLE;
        } else if (this.isPair(cards)) {
            return CARD_TYPE.PAIR;
        } else if (cards.length == 3 && this.isLeopard(cards)) {
            return CARD_TYPE.THREE;
        } else if (this.isSingleStraight(cards)) {
            return CARD_TYPE.SINGLE_STRAIGHT;
        } else if (this.isPairStraight(cards)) {
            return CARD_TYPE.PAIR_STRAIGHT;
        } else if (this.isThreeStraight(cards)) {
            return CARD_TYPE.THREE_STRAIGHT;
        } else if (this.isBomb(cards)) {
            return CARD_TYPE.BOMB;
        }
        return CARD_TYPE.NONE;
    }

    static is510K(cards: number[]) {
        if (cards.length != 3) {
            return false;
        }
        let dict = this.parseCardValueTable(cards);
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
        dict = this.parseCardValueTable(cards);
        for (let i in dict) {
            if (dict[i] == commonCardAmount) {
                return true;
            }
        }
        return false;
    }

    static isSingleStraight(cards: number[]) {
        let cnt = this.getSameCardValueCnt(cards);
        return cnt[1] == cards.length && cnt[1] >= 5 && this.isStraight(cards);
    }

    static isStraight(cards: number[]) {
        let dict: { [key: number]: number } = {};
        let minValue = 99;
        let maxValue = 0;
        for (let card of cards) {
            let value = this.getCardPoint(card);
            if (value > 14) {
                return false;
            }
            if (value < minValue) {
                minValue = value;
            }
            if (value > maxValue) {
                maxValue = value;
            }
            dict[value] = dict[value] ? dict[value] + 1 : 1;
        }
        let straightLen = maxValue - minValue + 1;
        if (cards.length % straightLen != 0) {
            return false;
        }
        let amount = cards.length / straightLen;
        for (let i = minValue; i <= maxValue; ++i) {
            if (dict[i] != amount) {
                return false;
            }
        }
        return true;
    }

    static isPairStraight(cards: number[]) {
        let cnt = this.getSameCardValueCnt(cards);
        return cnt[2] * 2 == cards.length && cnt[2] >= 3 && this.isStraight(cards);
    }

    static isThreeStraight(cards: number[]) {
        let cnt = this.getSameCardValueCnt(cards);
        return cnt[3] * 3 == cards.length && cnt[3] >= 2 && this.isStraight(cards);
    }

    static isCommonBomb(cards: number[]) {
        return cards.length >= 4 && this.isLeopard(cards);
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

    static getFoldPoint(cards: number[]) {
        let dict = this.parseCardValueTable(cards);
        return dict[5] * 5 + dict[10] * 10 + dict[13] * 10;
    }

    static isBetterCard(card1: number, card2: number) {
        let point1 = this.getCardPoint(card1);
        let point2 = this.getCardPoint(card2);
        if (point1 != point2) {
            return point2 - point1;
        } else {
            // 防止大小王对比出问题
            point1 = this.getCardValue(card1);
            point2 = this.getCardValue(card2);
            if (point1 != point2) {
                return point2 - point1;
            } else {
                return -1;
            }
        }
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
            let point = this.getCardPoint(cards[0]);
            return cards.length * 1000 + point;
        }
        return 0;
    }

    static isGhost(card: number) {
        return this.getCardDecor(card) == PokerCardDecor.GHOST;
    }

    static isBetter(cards1: number[], cards2: number[]) {
        let cardType1 = this.getCardType(cards1);
        let cardType2 = this.getCardType(cards2);
        if (cardType1 != cardType2) {
            if (cardType1 == CARD_TYPE.BOMB) {
                return false;
            } else if (cardType2 == CARD_TYPE.BOMB) {
                return true;
            } else {
                // 错误情况，不同类型不能出牌
                return false;
            }
        } else {
            if (cardType1 == CARD_TYPE.BOMB) {
                let cardValue1 = this.getBombValue(cards1);
                let cardValue2 = this.getBombValue(cards2);
                return cardValue1 < cardValue2;
            } else {
                cards1.sort(this.isBetterCard.bind(this));
                cards2.sort(this.isBetterCard.bind(this));
                return this.isBetterCard(cards1[0], cards2[0]) > 0;
            }
        }
    }

    static getBonusFactor(cards: number[]) {
        // 4个纯2
        if (cards.length == 4 && this.getCardValue(cards[0]) == 2 && this.isLeopard(cards)) {
            return 1;
        }
        let value = this.getBombValue(cards) / 1000;
        if (value >= 5) {
            if (this.isLeopard(cards)) {
                return 1 << (value - 5);
            } else {
                let dict = this.parseCardPointTable(cards);
                for (let point in dict) {
                    let amount = dict[point];
                    if (amount && Number(point) != 16) {
                        if (amount >= 5) {
                            return 1 << (amount - 5);
                        }
                    }
                }
            }
        }
        return 0;
    }
}