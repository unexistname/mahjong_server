import { PokerCardDecor } from "../../Base/PokerCardDecor";
import PokerCardPointMgr from "../../Base/PokerCardPointMgr";

export enum CARD_TYPE {
    NONE,
    SINGLE,
    PAIR,
    THREE,
    SINGLE_STRAIGHT,
    PAIR_STRAIGHT,
    THREE_STRAIGHT,
    THREE_BELT_ONE,
    THREE_BELT_PAIR,
    THREE_STRAIGHT_BELT_ONE,
    THREE_STRAIGHT_BELT_PAIR,
    BOMB,
}

export default class PlayPokerCardPointMgr extends PokerCardPointMgr {
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

    static isSingle(cards: number[]) {
        return cards.length == 1;
    }

    static isPair(cards: number[]) {
        return cards.length == 2 && this.isLeopard(cards);
    }

    static isThree(cards: number[]) {
        return cards.length == 3 && this.isLeopard(cards);
    }

    static getCardType(cards: number[]) {
        for (let cardType of this.getLegalCardTypes()) {
            if (this.isCardType(cardType, cards)) {
                return cardType;
            }
        }
        return CARD_TYPE.NONE;
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
        ]
    }

    static isCardType(cardType: CARD_TYPE, cards: number[]) {
        switch (cardType) {
            case CARD_TYPE.BOMB:
                return this.isBomb(cards);
            case CARD_TYPE.SINGLE:
                return this.isSingle(cards);
            case CARD_TYPE.PAIR:
                return this.isPair(cards);
            case CARD_TYPE.THREE:
                return this.isThree(cards);
            case CARD_TYPE.SINGLE_STRAIGHT:
                return this.isSingleStraight(cards);
            case CARD_TYPE.PAIR_STRAIGHT:
                return this.isPairStraight(cards);
            case CARD_TYPE.THREE_STRAIGHT:
                return this.isThreeStraight(cards);
            case CARD_TYPE.THREE_BELT_ONE:
                return this.isThreeBeltOne(cards);
            case CARD_TYPE.THREE_BELT_PAIR:
                return this.isThreeBeltPair(cards);
            case CARD_TYPE.THREE_STRAIGHT_BELT_ONE:
                return this.isThreeStraightBeltOne(cards);
            case CARD_TYPE.THREE_STRAIGHT_BELT_PAIR:
                return this.isThreeStraightBeltPair(cards);
            default:
                return false;
        }
    }

    static is510K(cards: number[]) {
        if (cards.length != 3) {
            return false;
        }
        let dict = this.parseCardPointTable(cards);
        return dict[5] && dict[10] && dict[13];
    }

    static isStraight(cards: number[], canValueStraight: boolean = false) {
        let valueDict: { [key: number]: number } = {};
        let pointDict: { [key: number]: number } = {};
        let minValue = 99;
        let maxValue = 0;
        let minPoint = 99;
        let maxPoint = 0;
        for (let card of cards) {
            let value = this.getCardValue(card);
            let point = this.getCardPoint(card);
            if (point > 14) {
                return false;
            }
            if (value < minValue) {
                minValue = value;
            }
            if (value > maxValue) {
                maxValue = value;
            }
            if (point < minPoint) {
                minPoint = point;
            }
            if (point > maxPoint) {
                maxPoint = point;
            }
            pointDict[point] = pointDict[point] ? pointDict[point] + 1 : 1;
            valueDict[point] = valueDict[point] ? valueDict[point] + 1 : 1;
        }
        return this.isMuiltStraight(pointDict, minPoint, maxPoint, cards.length)
                || (canValueStraight && this.isMuiltStraight(valueDict, minValue, maxValue, cards.length));
    }

    static isMuiltStraight(dict: any, min: number, max: number, len: number) {
        let straightLen = max - min + 1;
        if (len % straightLen != 0) {
            return false;
        }
        let amount = len / straightLen;
        for (let i = min; i <= max; ++i) {
            if (dict[i] != amount) {
                return false;
            }
        }
        return true;
    }

    static isSingleStraight(cards: number[]) {
        let cnt = this.getSameCardValueCnt(cards);
        return cnt[1] == cards.length && cnt[1] >= 5 && this.isStraight(cards);
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
        if (this.isCommonBomb(cards)) {
            return true;
        }
        return false;
    }

    static getFoldPoint(cards: number[]) {
        let dict = this.parseCardValueTable(cards);
        return (dict[5] || 0) * 5 + (dict[10] || 0) * 10 + (dict[13] || 0) * 10;
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
        if (this.isLeopard(cards)) {
            let point = this.getCardPoint(cards[0]);
            return cards.length * 1000 + point;
        }
        return 0;
    }

    static isGhost(card: number) {
        return this.getCardDecor(card) == PokerCardDecor.GHOST;
    }

    static isThreeBeltOne(cards: number[]) {
        if (cards.length != 4) {
            return false;
        }
        let cnt = this.getSameCardValueCnt(cards);
        return cnt[1] && cnt[3];
    }

    static isThreeBeltPair(cards: number[]) {
        if (cards.length != 5) {
            return false;
        }
        let cnt = this.getSameCardValueCnt(cards);
        return cnt[2] && cnt[3];
    }

    static isThreeStraightBeltOne(cards: number[]) {
        if (cards.length % 4 != 0) {
            return false;
        }
        let cnt = this.getSameCardValueCnt(cards);
        if (!(cnt[1] && cnt[3]) && !cnt[4]) {
            return false;
        }
        let amount = 0;
        amount += cnt[1] ? cnt[1] : 0;
        amount += cnt[3] ? cnt[3] * 3 : 0;
        amount += cnt[4] ? cnt[4] * 4 : 0;
        if (amount != cards.length) {
            return false;
        }
        let dict = this.parseCardValueTable(cards);
        let straight = [];
        for (let card in dict) {
            if (dict[card] == 3 || dict[card] == 4) {
                straight.push(Number(card));
            }
        }
        return this.isStraight(straight);
    }

    static isThreeStraightBeltPair(cards: number[]) {
        if (cards.length % 5 != 0) {
            return false;
        }
        let cnt = this.getSameCardValueCnt(cards);
        if (!cnt[2] || !cnt[3]) {
            return false;
        }
        if (cnt[2] * 2 + cnt[3] * 3 != cards.length) {
            return false;
        }
        let dict = this.parseCardValueTable(cards);
        let straight = [];
        for (let card in dict) {
            if (dict[card] == 3) {
                straight.push(Number(card));
            }
        }
        return this.isStraight(straight);
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
            } else if (cardType1 == CARD_TYPE.THREE_BELT_ONE
                    || cardType1 == CARD_TYPE.THREE_BELT_PAIR
                    || cardType1 == CARD_TYPE.THREE_STRAIGHT_BELT_ONE
                    || cardType1 == CARD_TYPE.THREE_STRAIGHT_BELT_PAIR) {
                let amount1 = this.parseCardPointAmountTable(cards1);
                let amount2 = this.parseCardPointAmountTable(cards2);
                amount1[3].sort();
                amount2[3].sort();
                let point1 = amount1[3][0];
                let point2 = amount2[3][0];
                return point1 < point2;
            } else {
                cards1.sort(this.isBetterCard.bind(this));
                cards2.sort(this.isBetterCard.bind(this));
                return this.isBetterCard(cards1[0], cards2[0]) > 0;
            }
        }
    }
    
    static findCards(holds: number[], points: number[], amount: number) {
        let dict: { [key: number]: number } = {};
        let res = [];
        for (let hold of holds) {
            let point = this.getCardPoint(hold);
            if (points.indexOf(point) >= 0) {
                if (dict[point] && dict[point] >= amount) {
                    continue;
                } else {
                    res.push(hold);
                }
            }
        }
        return res;
    }

    static findMultiStraight(min: number, len: number, holds: number[], multi: number) {
        let dict = this.parseCardPointTable(holds);
        let head = null;
        for (let i = 1 + min; i <= 15 - len + 1; ++i) {
            if (dict[i] && dict[i] >= multi) {
                if (head == null) {
                    head = i;
                } else if (i - head + 1 == len) {
                    let points = [];
                    for (let j = head; j < head + len; ++j) {
                        points.push(j);
                    }
                    return this.findCards(holds, points, multi);
                }
            } else {
                head = null;
            }
        }
    }

    static findBetterSingle(folds: number[], holds: number[]) {
        let card = this.getCardPoint(folds[0]);
        for (let hold of holds) {
            if (this.getCardPoint(hold) > card) {
                return [hold];
            }
        }
    }

    static findBetterPair(folds: number[], holds: number[]) {
        let card = this.getCardPoint(folds[0]);
        let dict = this.parseCardPointTable(holds);
        for (let point in dict) {
            if (Number(point) > card && dict[point] && dict[point] >= 2) {
                return this.findCards(holds, [Number(point)], 2);
            }
        }
    }
    
    static findBetterThree(folds: number[], holds: number[]) {
        let card = this.getCardPoint(folds[0]);
        let amount = this.parseCardPointAmountTable(holds);
        if (amount[3]) {
            for (let point of amount[3]) {
                if (point > card) {
                    return this.findCards(holds, [point], 3);
                }
            }
        }
    }

    static findBetterPairStraight(folds: number[], holds: number[]) {
        let len = folds.length / 2;
        let min = this.getCardPoint(folds[0]);
        let res = this.findMultiStraight(min, len, holds, 2);
        if (res && res.length > 0) {
            return res;
        }
    }

    static findBetterThreeStraight(folds: number[], holds: number[]) {
        let len = folds.length / 3;
        let min = this.getCardPoint(folds[0]);
        let res = this.findMultiStraight(min, len, holds, 3);
        if (res && res.length > 0) {
            return res;
        }
    }

    static findBetterThreeBeltOne(folds: number[], holds: number[]) {
        if (holds.length < 4) {
            return;
        }        
        let amount = this.parseCardPointAmountTable(folds);
        let point = amount[3][0];
        amount = this.parseCardPointAmountTable(holds);
        if (amount[3]) {
            for (let point2 of amount[3]) {
                if (point2 > point) {
                    let three = this.findCards(holds, [point2], 3);
                    for (let hold of holds) {
                        if (three.indexOf(hold) >= 0) {
                            continue;
                        }
                        three.push(hold);
                        return three;
                    }
                }
            }
        }
    }

    static findBetterThreeBeltPair(folds: number[], holds: number[]) {
        if (holds.length < 5) {
            return;
        }        
        let amount = this.parseCardPointAmountTable(folds);
        let point = amount[3][0];
        amount = this.parseCardPointAmountTable(holds);
        if (amount[3] && amount[2]) {
            for (let point2 of amount[3]) {
                if (point2 > point) {
                    let three = this.findCards(holds, [point2], 3);
                    for (let point3 of amount[2]) {
                        let pair = this.findCards(holds, [point3], 2);
                        return three.concat(pair);
                    }
                }
            }
        }
    }

    static findBetterThreeStraightBeltOne(folds: number[], holds: number[]) {
        let amount = this.parseCardPointAmountTable(folds);
        let minPoint = 99;
        for (let point of amount[3]) {
            if (point < minPoint) {
                minPoint = point;
            }
        }
        let len = folds.length / 4;
        let straight = this.findMultiStraight(minPoint, len, holds, 3);
        if (straight && straight.length > 0) {
            let one = [];
            for (let hold of holds) {
                if (straight.indexOf(hold) >= 0) {
                    one.push(hold);
                    if (one.length == len) {
                        return straight.concat(one);
                    }
                }
            }
        }
    }

    static findBetterThreeStraightBeltPair(folds: number[], holds: number[]) {
        let amount = this.parseCardPointAmountTable(folds);
        let minPoint = 99;
        for (let point of amount[3]) {
            if (point < minPoint) {
                minPoint = point;
            }
        }
        let len = folds.length / 5;
        let straight = this.findMultiStraight(minPoint, len, holds, 3);
        if (straight && straight.length > 0) {
            amount = this.parseCardPointAmountTable(holds);
            let pairs: number[] = [];
            for (let hold of straight) {
                let point = this.getCardPoint(hold);
                let index = amount[3].indexOf(point);
                if (index >= 0) {
                    amount[3].splice(index, 1);
                }
            }
            let data = amount[2].concat(amount[3]);
            for (let point of data) {
                let pair = this.findCards(holds, [point], 2);
                if (pair && pair.length > 0) {
                    pairs = pairs.concat(pair);
                    if (pairs.length == 2 * len) {
                        return straight.concat(pairs);
                    }
                }
            }
        }
    }

    static findBomb(holds: number[]) {
        let amount = this.parseCardPointAmountTable(holds);
        if (amount[4]) {
            return this.findCards(holds, [amount[4][0]], 4);
        }
    }

    static findBetterBomb(folds: number[], holds: number[]) {
        let amount = this.parseCardPointAmountTable(holds);
        let minPoint = 0;
        if (folds.length == 4) {
            minPoint = this.getCardPoint(folds[0]);
        }
        if (amount[4]) {
            for (let point of amount[4]) {
                if (point > minPoint) {
                    return this.findCards(holds, [point], 3);
                }
            }
        }
    }
    
    static getTipHold(folds: number[], holds: number[]) {
        folds.sort((a: number, b: number) => {
            return this.getCardPoint(a) - this.getCardPoint(b);
        });
        let cardType = this.getCardType(folds);
        let res;
        if (cardType == CARD_TYPE.SINGLE) {
            res = this.findBetterSingle(folds, holds);
        } else if (cardType == CARD_TYPE.PAIR) {
            res = this.findBetterPair(folds, holds);
        } else if (cardType == CARD_TYPE.THREE) {
            res = this.findBetterThree(folds, holds);
        } else if (cardType == CARD_TYPE.PAIR_STRAIGHT) {
            res = this.findBetterPairStraight(folds, holds);
        } else if (cardType == CARD_TYPE.THREE_STRAIGHT) {
            res = this.findBetterThreeStraight(folds, holds);
        } else if (cardType == CARD_TYPE.THREE_BELT_ONE) {
            res = this.findBetterThreeBeltOne(folds, holds);
        } else if (cardType == CARD_TYPE.THREE_BELT_PAIR) {
            res = this.findBetterThreeBeltPair(folds, holds);
        } else if (cardType == CARD_TYPE.THREE_STRAIGHT_BELT_ONE) {
            res = this.findBetterThreeStraightBeltOne(folds, holds);
        } else if (cardType == CARD_TYPE.THREE_STRAIGHT_BELT_PAIR) {
            res = this.findBetterThreeStraightBeltPair(folds, holds);
        } else if (cardType == CARD_TYPE.BOMB) {
            res = this.findBetterBomb(folds, holds);
        }
        if (res) {
            return res;
        } else if (cardType != CARD_TYPE.BOMB) {
            return this.findBomb(holds);
        }
    }
}