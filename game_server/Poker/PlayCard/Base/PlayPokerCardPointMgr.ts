import GameUtil from "../../../../utils/GameUtil";
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
    FOUR_BELT_TWO,
    FOUR_BELT_TWO_PAIR,
    FOUR_STRAIGHT_BELT_MULTI_SINGLE,
    FOUR_STRAIGHT_BELT_MULTI_PAIR,
    FOUR_BELT_PAIR,
    FOUR_STRAIGHT_BELT_PAIR,
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
            case CARD_TYPE.FOUR_BELT_PAIR:
                return this.isFourBeltPair(cards);
            case CARD_TYPE.FOUR_STRAIGHT_BELT_PAIR:
                return this.isFourStraightBeltPair(cards);
            case CARD_TYPE.FOUR_BELT_TWO:
                return this.isFourBeltTwo(cards);
            case CARD_TYPE.FOUR_BELT_TWO_PAIR:
                return this.isFourBeltTwoPair(cards);
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

    static getFoldPointCard(cards: number[]) {
        let res = [];
        for (let card of cards) {
            let value = this.getCardValue(card);
            if (value == 5 || value == 10 || value == 13) {
                res.push(card);
            }
        }
        return res;
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

    static isFourBeltTwo(cards: number[]) {
        if (cards.length != 6) {
            return false;
        }
        let cnt = this.getSameCardValueCnt(cards);
        if (cnt[4]) {
            if (cnt[1] && cnt[1] >= 2) {
                return true;
            }
            if (cnt[2]) {
                return true;
            }
        }
        return false;
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
        let dict = this.parseCardPointTable(cards);
        let straight = [];
        for (let card in dict) {
            if (dict[card] == 3 || dict[card] == 4) {
                straight.push(Number(card));
            }
        }
        return this.isContinuous(straight);
    }

    static isContinuous(points: number[]) {
        points.sort();
        let gap = points[points.length - 1] - points[0]
        return gap + 1 == points.length;
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
        let dict = this.parseCardPointTable(cards);
        let straight = [];
        for (let card in dict) {
            if (dict[card] == 3) {
                straight.push(Number(card));
            }
        }
        return this.isContinuous(straight);
    }

    static isFourStraightBeltPair(cards: number[]) {
        if (cards.length % 6 != 0) {
            return false;
        }
        let cnt = this.getSameCardValueCnt(cards);
        if (!cnt[2] || !cnt[4]) {
            return false;
        }
        if (cnt[2] * 2 + cnt[4] * 4 != cards.length) {
            return false;
        }
        let dict = this.parseCardPointTable(cards);
        let straight = [];
        for (let card in dict) {
            if (dict[card] == 4) {
                straight.push(Number(card));
            }
        }
        return this.isContinuous(straight);
    }

    static isFourBeltPair(cards: number[]) {
        if (cards.length != 6) {
            return false;
        }
        let cnt = this.getSameCardValueCnt(cards);
        return cnt[2] && cnt[4];
    }

    static isFourBeltTwoPair(cards: number[]) {
        if (cards.length != 8) {
            return false;
        }
        let cnt = this.getSameCardValueCnt(cards);
        return cnt[2] && cnt[4] && cnt[2] >= 2;
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
            } else if (cardType1 == CARD_TYPE.FOUR_BELT_PAIR
                || cardType1 == CARD_TYPE.FOUR_STRAIGHT_BELT_PAIR
                || cardType1 == CARD_TYPE.FOUR_BELT_TWO
                || cardType1 == CARD_TYPE.FOUR_BELT_TWO_PAIR) {
                let amount1 = this.parseCardPointAmountTable(cards1);
                let amount2 = this.parseCardPointAmountTable(cards2);
                amount1[4].sort();
                amount2[4].sort();
                let point1 = amount1[4][0];
                let point2 = amount2[4][0];
                return point1 < point2;
            } else {
                cards1.sort(this.isBetterCard.bind(this));
                cards2.sort(this.isBetterCard.bind(this));
                return this.isBetterCard(cards1[0], cards2[0]) > 0;
            }
        }
    }

    static findMultiStraight(min: number, len: number, holds: number[], multi: number) {
        let dict = this.parseCardPointTable(holds);
        let head = null;
        for (let i = 1 + min; i < 15; ++i) {
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

    static findBetterSingleStraight(folds: number[], holds: number[]) {
        let len = folds.length;
        let min = this.getCardPoint(folds[0]);
        let res = this.findMultiStraight(min, len, holds, 1);
        if (res && res.length > 0) {
            return res;
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

    static findStraight(holds: number[], multi: number) {
        let dict = this.parseCardPointTable(holds);
        let head = null, tail = null;
        for (let i = 1; i <= 16; ++i) {
            if (dict[i] && dict[i] >= multi) {
                if (head == null) {
                    head = i;
                }
                tail = i;
            } else {
                if (head && tail && head != tail) {
                    let points = [];
                    for (let j = head; j < tail; ++j) {
                        points.push(j);
                    }
                    return this.findCards(holds, points, multi);
                } else {
                    head = tail = null;
                }
            }
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
                    if (three) {
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
                        return three && pair && three.concat(pair);
                    }
                }
            }
        }
    }

    static getBeltPoints(canBeltPoints: number[], beltNum: number, needSort: boolean) {
        let points = [];
        if (canBeltPoints.length <= beltNum) {
            points = canBeltPoints;
        } else {
            needSort && canBeltPoints.sort();
            for (let i = 0; i < beltNum; ++i) {
                points.push(canBeltPoints[i]);
            }
        }
        return points;
    }

    static findBetterFourBeltPair(folds: number[], holds: number[]) {
        if (holds.length < 6) {
            return;
        }        
        let amount = this.parseCardPointAmountTable(folds);
        let point = amount[4][0];
        amount = this.parseCardPointAmountTable(holds);
        if (amount[4] && (amount[2] || amount[3])) {
            for (let point2 of amount[4]) {
                if (point2 > point) {
                    let four = this.findCards(holds, [point2], 3);
                    let belt = amount[2] || amount[3];
                    for (let point3 of belt) {
                        let pair = this.findCards(holds, [point3], 2);
                        return four && pair && four.concat(pair);
                    }
                }
            }
        }
    }

    static findBetterFourBeltTwo(folds: number[], holds: number[]) {
        if (holds.length < 6) {
            return;
        }        
        let amount = this.parseCardPointAmountTable(folds);
        let point = amount[4][0];
        amount = this.parseCardPointAmountTable(holds);
        if (amount[4] && (amount[1] || amount[2] || amount[3])) {
            for (let point2 of amount[4]) {
                if (point2 > point) {
                    let four = this.findCards(holds, [point2], 3);
                    if (amount[1] && amount[1].length >= 2) {
                        amount[1].sort();
                        let two = this.findCards(holds, [amount[1][0], amount[1][1]], 1);
                        return four && two && four.concat(two);
                    } else {
                        let belt = amount[2] || amount[3];
                        belt.sort();
                        let pair = this.findCards(holds, [belt[0]], 2);
                        return four && pair && four.concat(pair);
                    }
                }
            }
        }
    }

    static findBetterFourBeltTwoPair(folds: number[], holds: number[]) {
        if (holds.length < 8) {
            return;
        }        
        let amount = this.parseCardPointAmountTable(folds);
        let point = amount[4][0];
        amount = this.parseCardPointAmountTable(holds);
        if (amount[4] && (amount[2] || amount[3])) {
            for (let point2 of amount[4]) {
                if (point2 > point) {
                    let four = this.findCards(holds, [point2], 3);
                    let points = [];
                    if (amount[2]) {
                        amount[2].sort();
                        for (let point3 of amount[2]) {
                            points.push(point3);
                            if (points.length >= 2) {
                                break;
                            }
                        }
                    }
                    if (amount[3] && points.length < 2) {
                        amount[3].sort();
                        for (let point3 of amount[3]) {
                            points.push(point3);
                            if (points.length >= 2) {
                                break;
                            }
                        }
                    }
                    if (points.length == 2) {
                        let twoPair = this.findCards(holds, points, 2);
                        return four && twoPair && four.concat(twoPair);
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

    static findBetterFourStraightBeltPair(folds: number[], holds: number[]) {
        let amount = this.parseCardPointAmountTable(folds);
        let minPoint = 99;
        for (let point of amount[4]) {
            if (point < minPoint) {
                minPoint = point;
            }
        }
        let len = folds.length / 6;
        let straight = this.findMultiStraight(minPoint, len, holds, 4);
        if (straight && straight.length > 0) {
            amount = this.parseCardPointAmountTable(holds);
            let pairs: number[] = [];
            for (let hold of straight) {
                let point = this.getCardPoint(hold);
                let index = amount[4].indexOf(point);
                if (index >= 0) {
                    amount[4].splice(index, 1);
                }
            }
            let data: number[] = [];
            if (amount[2]) {
                data = data.concat(amount[3]);
            }
            if (amount[3]) {
                data = data.concat(amount[3]);
            }
            if (data.length + amount[4].length * 2 < len) {
                return
            }
            let pair = this.findCards(holds, data.slice(0, len), 2);
            if (pair && pair.length > 0) {
                len -= pairs.length / 2;

                pairs = pairs.concat(pair);
                straight = straight.concat(pairs);
                if (straight.length == 2 * len) {
                    return straight;
                }
            }
            let fourLen = len / 2;
            let four = this.findCards(holds, amount[4].slice(0, fourLen), 4);
            if (four) {
                straight = straight.concat(four);
            }
            if (len % 2 == 1) {
                let left = this.findCards(holds, amount[4].slice(fourLen, fourLen + 1), 2);
                if (left) {
                    straight = straight.concat(left);
                }
            }
            if (straight.length == 2 * len) {
                return straight;
            }
        }
    }

    static findMinLeopard(holds: number[], num: number) {
        let amount = this.parseCardPointAmountTable(holds);
        if (amount[num]) {
            amount[num].sort();
            return this.findCards(holds, [amount[num][0]], num);
        }
    }

    static findSingle(holds: number[]) {
        return this.findMinLeopard(holds, 1);
    }

    static findPair(holds: number[]) {
        return this.findMinLeopard(holds, 2);
    }

    static findThree(holds: number[]) {
        return this.findMinLeopard(holds, 3);
    }

    static findThreeBeltOne(holds: number[]) {
        let three = this.findThree(holds);
        let one = this.findSingle(holds);
        if (three && one) {
            return GameUtil.mergeList(three, one);
        }
    }

    static findThreeBeltPair(holds: number[]) {
        let three = this.findThree(holds);
        let pair = this.findPair(holds);
        if (three && pair) {
            return GameUtil.mergeList(three, pair);
        }
    }

    static findThreeStraight(holds: number[]) {
        return this.findStraight(holds, 3);
    }

    static findThreeStraightBeltOne(holds: number[]) {
        let threeStraight = this.findStraight(holds, 3);
        if (threeStraight) {
            let len = threeStraight.length / 3;
            let amount = this.parseCardPointAmountTable(holds);
            let one;
            if (amount[1] && amount[1].length >= len) {
                amount[1].sort();
                one = this.findCards(holds, amount[1].slice(0, len), 1);
            } else if (amount[2]) {
                amount[2].sort();
                if (amount[1] && (amount[2].length * 2 + amount[1].length >= len && (len - amount[1].length) % 2 == 0)) {
                    one = this.findCards(holds, amount[1], 1);
                    let pairLen = (len - amount[1].length) / 2;
                    let pair = this.findCards(holds, amount[2].slice(0, pairLen), 2);
                    one = one && pair && GameUtil.mergeList(one, pair);
                } else {
                    if (amount[2].length * 2 >= len && len % 2 == 0) {
                        one = this.findCards(holds, amount[2].slice(0, len / 2), 2);
                    }
                }
            }
            if (one) {
                return GameUtil.mergeList(threeStraight, one);
            }
        }
    }

    static findThreeStraightBeltPair(holds: number[]) {
        let threeStraight = this.findStraight(holds, 3);
        if (threeStraight) {
            let len = threeStraight.length / 3;
            let amount = this.parseCardPointAmountTable(holds);
            if (amount[2] && amount[2].length >= len) {
                amount[2].sort();
                let pair = this.findCards(holds, amount[2].slice(0, len), 2);
                return pair && GameUtil.mergeList(threeStraight, pair);
            }
        }
    }

    static findFourBeltPair(holds: number[]) {
        let four = this.findMinLeopard(holds, 4);
        let pair = this.findPair(holds);
        return four && pair && GameUtil.mergeList(four, pair);
    }

    static findFourBeltTwo(holds: number[]) {
        let four = this.findMinLeopard(holds, 4);
        if (four) {
            let amount = this.parseCardPointAmountTable(holds);
            if (amount[1] && amount[1].length >= 2) {
                amount[1].sort();
                let twoPair = this.findCards(holds, [amount[1][0], amount[1][1]], 2);
                return twoPair && GameUtil.mergeList(four, twoPair);
            }
        }
    }

    static findFourBeltTwoPair(holds: number[]) {
        let four = this.findMinLeopard(holds, 4);
        if (four) {
            let amount = this.parseCardPointAmountTable(holds);
            if (amount[2] && amount[2].length >= 2) {
                amount[2].sort();
                let twoPair = this.findCards(holds, [amount[2][0], amount[2][1]], 2);
                return twoPair && GameUtil.mergeList(four, twoPair);
            }
        }
    }

    static findFourStraightBeltPair(holds: number[]) {
        let fourStraight = this.findStraight(holds, 4);
        if (fourStraight) {
            let len = fourStraight.length / 4;
            let amount = this.parseCardPointAmountTable(holds);
            if (amount[2] && amount[2].length >= len) {
                amount[2].sort();
                let pair = this.findCards(holds, amount[2].slice(0, len), 2);
                return pair && GameUtil.mergeList(fourStraight, pair);
            }
        }
    }

    static findBomb(holds: number[]) {
        return this.findMinLeopard(holds, 4);
    }

    static findCardByType(holds: number[], type: CARD_TYPE) {
        switch (type) {
            case CARD_TYPE.SINGLE:
                return this.findSingle(holds);
            case CARD_TYPE.PAIR:
                return this.findPair(holds);
            case CARD_TYPE.THREE:
                return this.findThree(holds);
            case CARD_TYPE.THREE_BELT_ONE:
                return this.findThreeBeltOne(holds);
            case CARD_TYPE.THREE_BELT_PAIR:
                return this.findThreeBeltPair(holds);
            case CARD_TYPE.THREE_STRAIGHT:
                return this.findThreeStraight(holds);
            case CARD_TYPE.THREE_STRAIGHT_BELT_ONE:
                return this.findThreeStraightBeltOne(holds);
            case CARD_TYPE.THREE_STRAIGHT_BELT_PAIR:
                return this.findThreeStraightBeltPair(holds);
            case CARD_TYPE.FOUR_BELT_PAIR:
                return this.findFourBeltPair(holds);
            case CARD_TYPE.FOUR_STRAIGHT_BELT_PAIR:
                return this.findFourStraightBeltPair(holds);
            case CARD_TYPE.FOUR_BELT_TWO:
                return this.findFourBeltTwo(holds);
            case CARD_TYPE.FOUR_BELT_TWO_PAIR:
                return this.findFourBeltTwoPair(holds);
            case CARD_TYPE.BOMB:
                return this.findBomb(holds);
        }
    }

    static findBetterBomb(folds: number[], holds: number[]) {
        let amount = this.parseCardPointAmountTable(holds);
        let minPoint = this.getCardPoint(folds[0]);
        for (let i = folds.length; i <= 8; ++i) {
            if (amount[i]) {
                for (let point of amount[i]) {
                    if (point > minPoint || i > folds.length) {
                        return this.findCards(holds, [point], i);
                    }
                }
            }
        }
    }

    static sortCard(holds: number[]) {
        let amount = this.parseCardPointAmountTable(holds);
        let res = [];
        let ghost: number[] = [];
        for (let i = 8; i > 0; --i) {
            if (amount[i]) {
                amount[i].sort((a, b) => b - a);
                for (let point of amount[i]) {
                    let cards = this.findCards(holds, [point], i);
                    if (cards) {
                        if (point > 15) {
                            ghost = GameUtil.mergeList(ghost, cards);
                        } else {
                            res = GameUtil.mergeList(res, cards);
                        }
                    }
                }
            }
        }
        ghost.sort((a, b) => b - a);
        res = GameUtil.mergeList(ghost, res);
        return res;
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
        } else if (cardType == CARD_TYPE.SINGLE_STRAIGHT) {
            res = this.findBetterSingleStraight(folds, holds);
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
        } else if (cardType == CARD_TYPE.FOUR_BELT_PAIR) {
            res = this.findBetterFourBeltPair(folds, holds);
        } else if (cardType == CARD_TYPE.FOUR_BELT_TWO) {
            res = this.findBetterFourBeltTwo(folds, holds);
        } else if (cardType == CARD_TYPE.FOUR_BELT_TWO_PAIR) {
            res = this.findBetterFourBeltTwoPair(folds, holds);
        } else if (cardType == CARD_TYPE.FOUR_STRAIGHT_BELT_PAIR) {
            res = this.findBetterFourStraightBeltPair(folds, holds);
        } else if (cardType == CARD_TYPE.BOMB) {
            res = this.findBetterBomb(folds, holds);
        }
        if (res && res.length > 0) {
            return res;
        } else if (cardType != CARD_TYPE.BOMB) {
            return this.findBomb(holds);
        }
    }
}