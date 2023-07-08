import PokerCardPointMgr from "../Poker/PokerCardPointMgr";

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

export default class PDKCardPointMgr extends PokerCardPointMgr {

    static getCardPoint(card: number) {
        let value = this.getCardValue(card);
        return value < 3 ? value + 13 : value;
    }

    static isStraight(cards: number[]) {
        let minValue = 99;
        let maxValue = 0;
        let minPoint = 99;
        let maxPoint = 0;
        for (let card of cards) {
            let value = this.getCardValue(card);
            let point = this.getCardPoint(card);
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
        }
        
        if ((maxValue - minValue + 1) == cards.length) {
            // A23~JQK
            return true;
        }

        if ((maxPoint - minPoint + 1) == cards.length) {
            // 345~KA2
            return true;
        }
        return false;
    }

    static isPair(cards: number[]) {
        if (cards.length == 2 && this.isLeopard(cards)) {
            return true;
        }
        return false;
    }

    static isSingleStraight(cards: number[]) {
        let cnt = this.getSameCardValueCnt(cards);
        return cnt[1] == cards.length && cnt[1] >= 5 && this.isStraight(cards);
    }

    static isPairStraight(cards: number[]) {
        let cnt = this.getSameCardValueCnt(cards);
        console.log("对顺qqqqqqqqqqqqqq", cnt, cards, this.isStraight(cards));
        return cnt[2] * 2 == cards.length && cnt[2] >= 3 && this.isStraight(cards);
    }

    static isThreeStraight(cards: number[]) {
        let cnt = this.getSameCardValueCnt(cards);
        return cnt[3] * 3 == cards.length && cnt[3] >= 2 && this.isStraight(cards);
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
            if (cards.length == 4) {
                return true;
            }
            if (cards.length == 3 && this.getCardValue(cards[0]) == 1) {
                return true;
            }
        }
        return false;
    }

    static isThreeBeltOne(cards: number[]) {
        if (cards.length != 4) {
            return false;
        }
        let cnt = this.getSameCardValueCnt(cards);
        console.log("aaaaaaaaaa", cards, cnt);
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
        if (!cnt[1] || !cnt[3] || !cnt[4]) {
            return false;
        }
        let amount = 0;
        amount += cnt[1] ? cnt[1] : 0;
        amount += cnt[3] ? cnt[3] * 3 : 0;
        amount += cnt[4] ? cnt[4] * 4: 0;
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
        if (cards.length % 4 != 0) {
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

    static getCardType(cards: number[]) {
        if (this.isBomb(cards)) {
            return CARD_TYPE.BOMB;
        } else if (cards.length == 1) {
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
        } else if (this.isThreeBeltOne(cards)) {
            return CARD_TYPE.THREE_BELT_ONE;
        } else if (this.isThreeBeltPair(cards)) {
            return CARD_TYPE.THREE_BELT_PAIR;
        } else if (this.isThreeStraightBeltOne(cards)) {
            return CARD_TYPE.THREE_STRAIGHT_BELT_ONE;
        } else if (this.isThreeStraightBeltPair(cards)) {
            return CARD_TYPE.THREE_STRAIGHT_BELT_PAIR;
        }
        return CARD_TYPE.NONE;
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

    static getHardEatHold(folds: number[], holds: number[]) {
        folds.sort((a: number, b: number) => {
            return this.getCardPoint(a) - this.getCardPoint(b);
        });
        let cardType = this.getCardType(folds);
        if (cardType == CARD_TYPE.SINGLE) {
            let card = this.getCardPoint(folds[0]);
            for (let hold of holds) {
                if (this.getCardPoint(hold) > card) {
                    return [hold];
                }
            }
        } else if (cardType == CARD_TYPE.PAIR) {
            let card = this.getCardPoint(folds[0]);
            let dict = this.parseCardPointTable(holds);
            for (let point in dict) {
                if (Number(point) > card && dict[point] && dict[point] >= 2) {
                    return this.findCards(holds, [Number(point)], 2);
                }
            }
        } else if (cardType == CARD_TYPE.THREE) {
            let card = this.getCardPoint(folds[0]);
            let amount = this.parseCardPointAmountTable(holds);
            if (amount[3]) {
                for (let point of amount[3]) {
                    if (point > card) {
                        return this.findCards(holds, [point], 3);
                    }
                }
            }
        } else if (cardType == CARD_TYPE.PAIR_STRAIGHT) {
            let len = folds.length / 2;
            let min = this.getCardPoint(folds[0]);
            let res = this.findMultiStraight(min, len, holds, 2);
            if (res && res.length > 0) {
                return res;
            }
        } else if (cardType == CARD_TYPE.THREE_STRAIGHT) {
            let len = folds.length / 3;
            let min = this.getCardPoint(folds[0]);
            let res = this.findMultiStraight(min, len, holds, 3);
            if (res && res.length > 0) {
                return res;
            }
        } else if (cardType == CARD_TYPE.THREE_BELT_ONE) {
            if (holds.length >= 4) {
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
        } else if (cardType == CARD_TYPE.THREE_BELT_PAIR) {
            if (holds.length >= 5) {
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
        } else if (cardType == CARD_TYPE.THREE_STRAIGHT_BELT_ONE) {
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
        } else if (cardType == CARD_TYPE.THREE_STRAIGHT_BELT_PAIR) {
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
        let amount = this.parseCardPointAmountTable(holds);
        if (cardType != CARD_TYPE.BOMB) {
            if (amount[3] && amount[3].indexOf(14) >= 0) {
                return this.findCards(holds, [14], 3);
            }
            if (amount[4]) {
                return this.findCards(holds, [amount[4][0]], 4);
            }
        } else {
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
    }

    static isBetterCard(card1: number, card2: number) {
        return this.getCardPoint(card1) - this.getCardPoint(card2);
    }

    static isBetter(folds: number[], holds: number[]) {
        let cardType = this.getCardType(folds);
        let cardType2 = this.getCardType(holds);

        if (cardType2 == CARD_TYPE.BOMB && cardType != CARD_TYPE.BOMB) {
            return true;
        }

        folds.sort(this.isBetterCard.bind(this));
        holds.sort(this.isBetterCard.bind(this));

        switch (cardType) {
            case CARD_TYPE.SINGLE:
            case CARD_TYPE.PAIR:
            case CARD_TYPE.THREE:
            case CARD_TYPE.PAIR_STRAIGHT:
            case CARD_TYPE.THREE_STRAIGHT:
                return this.isBetterCard(folds[0], holds[0]) < 0;
            case CARD_TYPE.THREE_BELT_ONE:
            case CARD_TYPE.THREE_BELT_PAIR:
            case CARD_TYPE.THREE_STRAIGHT_BELT_ONE:
            case CARD_TYPE.THREE_STRAIGHT_BELT_PAIR:
                let amount1 = this.parseCardPointAmountTable(folds);
                let amount2 = this.parseCardPointAmountTable(holds);
                amount1[3].sort(this.isBetterCard.bind(this));
                amount2[3].sort(this.isBetterCard.bind(this));
                let card1 = amount1[3][0];
                let card2 = amount2[3][0];
                console.log("ssssssssss", folds, holds, amount1,amount2,card1, card2, this.isBetterCard(card1, card2));
                return this.isBetterCard(card1, card2) < 0;
            case CARD_TYPE.BOMB:
                if (folds.length != holds.length) {
                    return holds.length > folds.length;
                } else {
                    return this.isBetterCard(folds[0], holds[0]) < 0;
                }
            default:
                return false;
        }
    }
}