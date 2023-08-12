import GameUtil from "../../../../../utils/GameUtil";
import PokerCardPointMgr from "../../../Base/PokerCardPointMgr";


const SPECIAL_CARD_TYPE = {
    SUPREME_DRAGON: 33,  // 至尊清龙
    DRAGON: 32,          // 一条龙
    TWELVE_ROYAL: 31,    // 十二皇族
    THREE_SAME_DECOR_STRAIGHT: 30,   // 三同花顺
    THREE_BOMB: 29,      // 三分天下
    ALL_BIG: 28,         // 全大
    ALL_SMALL: 27,       // 全小
    ALL_SAME_DECOR: 26,  // 凑一色
    DOUBLE_MONSTER_DASH_THREE: 25,       // 双怪冲三
    FOUR_LEOPARD: 24,       // 四套三对
    FIVE_PAIR_ONE_LEOPARD: 23,  // 五对三条
    SIX_PAIR: 22,           // 六对半
    THREE_STRAIGHT: 21,     // 三顺子
    THREE_SAME_DECOR: 20,   // 三同花
};

const COMMON_CARD_TYPE = {
    SAME_DECOR_STRAIGHT: 17,    // 同花顺
    BOMB: 16,           // 炸弹
    GOURD: 15,          // 葫芦
    SAME_DECOR: 14,     // 同花
    STRAIGHT: 13,       // 顺子
    LEOPARD: 12,        // 豹子
    TWO_PAIR: 11,       // 两对
    ONE_PAIR: 10,       // 一对
    NONE: 0,
};

export default class SSSCardPointMgr extends PokerCardPointMgr {
    
    // 至尊清龙
    static isSupremeDragon(cards: number[]) {
        var decor = this.getCardDecor(cards[0]);
        var dict: { [key: number]: number } = {};
        for (var i = 0; i < cards.length; ++i) {
            var value = this.getCardValue(cards[i]);
            
            if (dict[value]) {
                return false;
            }
            if (decor != this.getCardDecor(cards[i])) {
                return false;
            }
            dict[value] = 1;
        }
        return true;
    }

    // 一条龙
    static isDragon(cards: number[]) {
        var dict: { [key: number]: number } = {};
        for (var i = 0; i < cards.length; ++i) {
            var value = this.getCardValue(cards[i]);
            if (dict[value]) {
                return false;
            }
            dict[value] = 1;
        }
        return true;
    }

    // 十二皇族
    static isTwelveRoyal(cards: number[]) {
        var small = 0;
        for (var i = 0; i < cards.length; ++i) {
            var value = this.getCardPoint(cards[i]);
            if (value <= 10) {
                small++;
                if (small > 1) {
                    return false;
                }
            }
        }
        return true;
    }

    // 三同花顺
    static isThreeSameDecorStraight(cards: number[]) {
        var dict: { [key: number]: number } = {};
        for (var i = 0; i < cards.length; ++i) {
            var value = this.getCardPoint(cards[i]);
            var decor = this.getCardDecor(cards[i]);
            var key = decor * 100 + value;
            dict[key] = dict[key] ? (dict[key] + 1) : 1;
        }
        var cnt = 0;
        var amount = 0;
        for (var decor = 1; decor <= 4; ++decor) {
            var cnt = 0;
            for (var value = 2; value <= 14; ++value) {
                var key = decor * 100 + value;
                if (dict[key]) {
                    cnt++;
                } else {
                    if (cnt > 0) {
                        if (cnt != 3 && cnt != 5 && cnt != 8 && cnt != 10) {
                            return false;
                        } else {
                            amount++;
                        }
                    }
                    cnt = 0;
                }
            }
            if (cnt > 0) {
                if (cnt != 3 && cnt != 5 && cnt != 8 && cnt != 10) {
                    return false;
                } else {
                    amount++;
                }
            }
        }
        if (amount > 3) {
            return false;
        }
        return true;
    }
    // 杂顺子
    static isThreeStraight(cards: number[]) {
        let dict = this.parseCardValueTable(cards);
        var cnt = 0;
        var begin: number[] = [];
        var end: number[] = [];
        for (var i = 2; i <= 14; ++i) {
            var value = i > 13 ? (i - 13) : i;
            if (dict[value]) {
                cnt++;
                if (dict[value-1]) {
                    if (dict[i-1] < dict[value]) {
                        for (var j = 0; j < dict[value] - dict[i-1]; ++j) {
                            begin.push(value);
                        }
                    } else if (dict[i-1] > dict[value]) {
                        for (var j = 0; j < dict[i-1] - dict[value]; ++j) {
                            end.push(value-1);
                        }
                    }
                } else {
                    begin.push(value);
                }
            } else {
                if (cnt > 0) {
                    end.push(i-1);
                }
                cnt = 0;
            }
        }
        if (cnt > 0) {
            end.push(i-1);
        }
        if (begin.length > 3) {
            return false;
        }
        if (begin.length == 1) {
            return true;
        }
        if (begin.length == 2) {
            for (var i = 0; i < end.length; ++i) {
                var len = end[i] - begin[0] + 1;
                if (len == 3 || len == 5 || len == 8 || len == 10) {
                    return true;
                }
            }
            return false;
        }

        var markBegin: { [key: number]: boolean } = [];
        var selectBegin: number[] = [];
        let check = (times: number) => {
            if (times == 3) {
                for (var i = 0; i < end.length; ++i) {
                    var dist = end[i] - selectBegin[i] + 1;
                    if (dist != 3 && dist != 5) {
                        return false;
                    }
                }
                return true;
            }
            for (var i = 0; i < begin.length; ++i) {
                if (markBegin[i]) {
                    continue;
                }
                if (begin[i] > end[times]) {
                    return false;
                }
                markBegin[i] = true;
                selectBegin.push(begin[i]);
                if (check(times + 1)) {
                    return true;
                }
                selectBegin.pop();
                markBegin[i] = false;
            }
            return false;
        }
        return check(0);
    }

    static getThreeStraight(cards: number[]) {
        var mark: { [key: number]: number[] } = {};
        var dict: { [key: number]: number } = {};
        for (var i = 0; i < cards.length; ++i) {
            let point = this.getCardPoint(cards[i]);
            dict[point] = dict[point] ? (dict[point] + 1) : 1;

            if (!mark[point]) mark[point] = [];
            mark[point].push(cards[i]);
        }
        // 方便三同花顺凑成对应的列表
        for (let point = 2; point <= 14; ++point) {
            mark[point].sort((a, b) => {
                return this.getCardDecor(a) - this.getCardDecor(b);
            });
        }

        var cnt = 0;
        var begin: number[] = [];
        var end: number[] = [];
        for (var i = 2; i <= 14; ++i) {
            var value = i;
            if (dict[value]) {
                cnt++;
                if (dict[value-1]) {
                    if (dict[i-1] < dict[value]) {
                        for (var j = 0; j < dict[value] - dict[i-1]; ++j) {
                            begin.push(value);
                        }
                    } else if (dict[i-1] > dict[value]) {
                        for (var j = 0; j < dict[i-1] - dict[value]; ++j) {
                            end.push(value-1);
                        }
                    }
                } else {
                    begin.push(value);
                }
            } else {
                if (cnt > 0) {
                    end.push(i-1);
                }
                cnt = 0;
            }
        }
        if (cnt > 0) {
            end.push(i-1);
        }
        if (begin.length > 3) {
            return [];
        }
        var holds: number[][] = [[], [], []];
        var pushCardToHold = (card: number) => {
            if (holds[0].length < 3) {
                holds[0].push(card);
            } else if (holds[1].length < 5) {
                holds[1].push(card);
            } else {
                holds[2].push(card);   
            }
        }
        var pushCard = (b: number, e: number) => {
            for (let value = b; value <= e; value++) {
                pushCardToHold(mark[value][0]);
                mark[value].splice(0, 0);
            }
        }
        if (begin.length == 1) {
            pushCard(begin[0], end[0]);
            return holds;
        }
        if (begin.length == 2) {
            for (var i = 0; i < end.length; ++i) {
                var len = end[i] - begin[0] + 1;
                if (len == 3 || len == 8) {
                    pushCard(begin[0], end[i]);
                    pushCard(begin[1], end[1-i]);
                    break;
                } else if (len == 5 || len == 10) {
                    pushCard(begin[1], end[1-i]);
                    pushCard(begin[0], end[i]);
                    break;
                }
            }
            return holds;
        }

        var markBegin: { [key: number]: boolean } = [];
        var selectBegin: number[] = [];
        let check = (times: number) => {
            if (times == 3) {
                for (var i = 0; i < end.length; ++i) {
                    var dist = end[i] - selectBegin[i] + 1;
                    if (dist != 3 && dist != 5) {
                        return false;
                    }
                }
                
                for (var i = 0; i < end.length; ++i) {
                    var dist = end[i] - selectBegin[i] + 1;
                    if (dist == 3) {
                        pushCard(selectBegin[i], end[i]);
                        for (var j = 0; j < end.length; ++j) {
                            if (j == i) continue;
                            pushCard(selectBegin[j], end[j]);
                        }
                        return true;
                    }
                }
            }
            for (var i = 0; i < begin.length; ++i) {
                if (markBegin[i]) {
                    continue;
                }
                if (begin[i] > end[times]) {
                    return false;
                }
                markBegin[i] = true;
                selectBegin.push(begin[i]);
                if (check(times + 1)) {
                    return true;
                }
                selectBegin.pop();
                markBegin[i] = false;
            }
            return false;
        }
        check(0);
        return holds;
    }

    // 三分天下
    static isThreeBomb(cards: number[]) {
        let dict = this.parseCardValueTable(cards);
        var cnt = 0;
        for (var i = 1; i <= 13; ++i) {
            if (dict[i] && dict[i] >= 4) {
                cnt++;
            }
        }
        return cnt >= 3;
    }

    // 全大
    static isAllBig(cards: number[]) {
        for (var i = 0; i < cards.length; ++i) {
            var value = this.getCardPoint(cards[i]);
            if (value < 8) {
                return false;
            }
        }
        return true;
    }

    // 全小
    static isAllSmall(cards: number[]) {
        for (var i = 0; i < cards.length; ++i) {
            var value = this.getCardPoint(cards[i]);
            if (value > 8) {
                return false;
            }
        }
        return true;
    }

    // 凑一色
    static isAllSameDecor(cards: number[]) {
        var decor = this.getCardDecor(cards[0]);
        for (var i = 0; i < cards.length; ++i) {
            if (decor != this.getCardDecor(cards[i])) {
                return false;
            }
        }
        return true;
    }

    // 双怪冲三
    static isDoubleMonsterDashThree(cards: number[]) {
        var cnt = this.getSameCardValueCnt(cards);
        if (cnt[3] == 2 && cnt[2] == 3) {
            return true;
        }
        return false;
    }

    // 四套三条
    static isFourLeopard(cards: number[]) {
        var cnt = this.getSameCardValueCnt(cards);
        if (cnt[3] == 4) {
            return true;
        }
        return false;
    }

    // 五对三条
    static isFivePairOneLeopard(cards: number[]) {
        var cnt = this.getSameCardValueCnt(cards);
        if (cnt[3] == 1 && cnt[2] == 5) {
            return true;
        }
        return false;
    }

    // 六对半
    static isSixPair(cards: number[]) {
        var cnt = this.getSameCardValueCnt(cards);
        if (cnt[2] == 6) {
            return true;
        }
        return false;
    }

    // 三同花
    static isThreeSameDecor(cards: number[]) {
        var cnt = this.parseCardDecorTable(cards);
        var hasThree = false;
        for (var i = 0; i < cards.length; ++i) {
            if (cnt[i]) {
                if (cnt[i] != 3 && cnt[i] != 5 && cnt[i] != 8 && cnt[i] != 10) {
                    return false;
                }
                if(cnt[i] == 3 || cnt[i] == 8) {
                    if (hasThree) {
                        return false;
                    }
                    hasThree = true;
                }
            }
        }
        return true;
    }

    static getSpecialMultiple(cards: number[]) {
        if (this.isSupremeDragon(cards)) {
            return 52;
        } else if (this.isDragon(cards)) {
            return 26;
        } else if (this.isTwelveRoyal(cards)) {
            return 24;
        } else if (this.isThreeSameDecorStraight(cards)) {
            return 18;
        } else if (this.isThreeBomb(cards)) {
            return 16;
        } else if (this.isAllBig(cards) || this.isAllSmall(cards)) {
            return 12;
        } else if (this.isAllSameDecor(cards)) {
            return 10;
        } else if (this.isDoubleMonsterDashThree(cards)) {
            return 8;
        } else if (this.isFourLeopard(cards)) {
            return 8;
        } else if (this.isSixPair(cards) || this.isThreeStraight(cards) || this.isThreeSameDecor(cards)) {
            return 3;
        }
        return 1;
    }

    static getSpecialCardValue(cards: number[]) {
        if (this.isSupremeDragon(cards)) {
            return 103000000;
        } else if (this.isDragon(cards)) {
            return 102000000;
        } else if (this.isTwelveRoyal(cards)) {
            return 101000000;
        } else if (this.isThreeSameDecorStraight(cards)) {
            return 100000000;
        } else if (this.isThreeBomb(cards)) {
            return 99000000;
        } else if (this.isAllBig(cards)) {
            return 98000000;
        } else if (this.isAllSmall(cards)) {
            return 97000000;
        } else if (this.isAllSameDecor(cards)) {
            return 96000000;
        } else if (this.isDoubleMonsterDashThree(cards)) {
            return 95000000;
        } else if (this.isFourLeopard(cards)) {
            return 94000000;
        } else if (this.isFivePairOneLeopard(cards)) {
            return 93000000;
        } else if (this.isSixPair(cards)) {
            return 92000000;
        } else if (this.isThreeStraight(cards)) {
            return 91000000;
        } else if (this.isThreeSameDecor(cards)) {
            return 90000000;
        } else {
            return 0;
        }
    }

    static compareSpecialCard(cards1: number[], cards2: number[]) {
        var value1 = this.getSpecialCardValue(cards1);
        var value2 = this.getSpecialCardValue(cards2);
        if (value1 != value2) {
            return value1 - value2;
        }

        var amount1 = this.parseCardPointAmountTable(cards1);
        var amount2 = this.parseCardPointAmountTable(cards2);

        for (var i = 4; i > 0; --i) {
            for (var j = 14; j > 1; --j) {
                var index1 = amount1[i] != null ? amount1[i].indexOf(j) : -1;
                var index2 = amount2[i] != null ? amount2[i].indexOf(j) : -1;
                if (index1 >= 0 && index2 >= 0) continue;
                if (index1 < 0 && index2 < 0) continue;
                return index1 - index2;
            }
        }
        return 0;
    }

    static getSortSpecialCard(holds: number[], type: number): number[][] | number[] {
        let cards = [];

        if (type == SPECIAL_CARD_TYPE.THREE_SAME_DECOR_STRAIGHT) {
            cards = this.getThreeStraight(holds);
        } else if (type == SPECIAL_CARD_TYPE.THREE_STRAIGHT) {
            cards = this.getThreeStraight(holds);
        } else {
            cards = GameUtil.deepClone(holds);
            if (type == SPECIAL_CARD_TYPE.THREE_SAME_DECOR) {
                cards.sort((a: number, b: number) => {
                    let decorA = this.getCardDecor(a);
                    let decorB = this.getCardDecor(b);
                    if (decorA != decorB) {
                        return decorA - decorB;
                    } else {
                        return this.getCardPoint(a) - this.getCardPoint(b);
                    }
                });
            } else {
                cards.sort((a: number, b: number) => {
                    let pointA = this.getCardPoint(a);
                    let pointB = this.getCardPoint(b);
                    if (pointA != pointB) {
                        return pointA - pointB;
                    } else {
                        return this.getCardDecor(a) - this.getCardDecor(b);
                    }
                });
            }
            cards = [cards.slice(0, 3), cards.slice(3, 8), cards.slice(8)];
        }

        return cards;
    }

    static getSpecialCardType(cards: number[]) {
        if (this.isSupremeDragon(cards)) {
            return SPECIAL_CARD_TYPE.SUPREME_DRAGON;
        } else if (this.isDragon(cards)) {
            return SPECIAL_CARD_TYPE.DRAGON;
        } else if (this.isTwelveRoyal(cards)) {
            return SPECIAL_CARD_TYPE.TWELVE_ROYAL;
        } else if (this.isThreeSameDecorStraight(cards)) {
            return SPECIAL_CARD_TYPE.THREE_SAME_DECOR_STRAIGHT;
        } else if (this.isThreeBomb(cards)) {
            return SPECIAL_CARD_TYPE.THREE_BOMB;
        } else if (this.isAllBig(cards)) {
            return SPECIAL_CARD_TYPE.ALL_BIG;
        } else if (this.isAllSmall(cards)) {
            return SPECIAL_CARD_TYPE.ALL_SMALL;
        } else if (this.isAllSameDecor(cards)) {
            return SPECIAL_CARD_TYPE.ALL_SAME_DECOR;
        } else if (this.isDoubleMonsterDashThree(cards)) {
            return SPECIAL_CARD_TYPE.DOUBLE_MONSTER_DASH_THREE;
        } else if (this.isFourLeopard(cards)) {
            return SPECIAL_CARD_TYPE.FOUR_LEOPARD;
        } else if (this.isFivePairOneLeopard(cards)) {
            return SPECIAL_CARD_TYPE.FIVE_PAIR_ONE_LEOPARD;
        } else if (this.isSixPair(cards)) {
            return SPECIAL_CARD_TYPE.SIX_PAIR;
        } else if (this.isThreeStraight(cards)) {
            return SPECIAL_CARD_TYPE.THREE_STRAIGHT;
        } else if (this.isThreeSameDecor(cards)) {
            return SPECIAL_CARD_TYPE.THREE_SAME_DECOR;
        }
        return 0;
    }

    // 普通牌型同花顺
    static isCommonSameDecorStraight(cards: number[]) {
        if (!this.isCommonSameDecor(cards)) {
            return false;
        }
        if (!this.isCommonStraight(cards)) {
            return false;
        }
        return true;
    }

    // 普通牌型铁支
    static isCommonBomb(cards: number[]) {
        var dict = this.parseCardValueTable(cards);
        for (var i in dict) {
            if (dict[i] == 4) {
                return true;
            }
        }
        return false;
    }

    // 普通牌型葫芦
    static isCommonGourd(cards: number[]) {
        var cnt = this.getSameCardValueCnt(cards);
        if (cnt[2] >= 1 && cnt[3] >= 1) {
            return true;
        }
        return false;
    }

    // 普通牌型同花
    static isCommonSameDecor(cards: number[]) {
        var decor;
        for (var i = 0; i < cards.length; i++) {
            var type = this.getCardDecor(cards[i]);
            if(decor == null){
                decor = type;
            } else if(type != decor){
                return false;
            }
        }
        return true;
    }

    // 普通牌型顺子
    static isCommonStraight(cards: number[]) {
        return this.isStraight(cards);
    }

    // 普通牌型三条
    static isCommonLeopard(cards: number[]) {
        let cnt = this.getSameCardValueCnt(cards);
        if (cnt[3] >= 1) {
            return true;
        }
        return false;
    }

    // 普通牌型两对
    static isCommonTwoPair(cards: number[]) {
        let cnt = this.getSameCardValueCnt(cards);
        if (cnt[2] >= 2) {
            return true;
        }
        return false;
    }

    // 普通牌型一对
    static isCommonOnePair(cards: number[]) {
        let cnt = this.getSameCardValueCnt(cards);
        return cnt[2] >= 1;
    }

    static getPairCardPoint(cards: number[]) {
        if (!cards) return 0;

        let amount = this.parseCardPointAmountTable(cards);
        let point = 0;
        for (var i = 4; i > 0; --i) {
            if (!amount[i]) continue;
            amount[i].sort((a, b) => b - a);
            for (let j of amount[i]) {
                for (let k = 0; k < i; ++k) {
                    point = point * 20 + j;
                }
            }
        }
        return point;
    }

    static getCommonSpecialValue(cards: number[]) {
        // this.getMixCardPoint的值不会超过20的5次方
        if (!cards) {
            return 0;
        }
        if (this.isCommonSameDecorStraight(cards)) {
            return 80000000 + this.getMixCardPoint(cards);
        } else if (this.isCommonBomb(cards)) {
            return 70000000 + this.getPairCardPoint(cards);
        } else if (this.isCommonGourd(cards)) {
            return 60000000 + this.getPairCardPoint(cards);
        } else if (this.isCommonSameDecor(cards)) {
            return 50000000 + this.getMixCardPoint(cards);
        } else if (this.isCommonStraight(cards)) {
            return 40000000 + this.getMixCardPoint(cards);
        } else if (this.isCommonLeopard(cards)) {
            return 30000000 + this.getPairCardPoint(cards);
        } else if (this.isCommonTwoPair(cards)) {
            return 20000000 + this.getPairCardPoint(cards);
        } else if (this.isCommonOnePair(cards)) {
            return 10000000 + this.getPairCardPoint(cards);
        } else {
            return this.getMixCardPoint(cards);
        }
    }

    static getCommonCardType(cards: number[]) {
        if (!cards) {
            return 0;
        }
        if (this.isCommonSameDecorStraight(cards)) {
            return COMMON_CARD_TYPE.SAME_DECOR_STRAIGHT;
        } else if (this.isCommonBomb(cards)) {
            return COMMON_CARD_TYPE.BOMB;
        } else if (this.isCommonGourd(cards)) {
            return COMMON_CARD_TYPE.GOURD;
        } else if (this.isCommonSameDecor(cards)) {
            return COMMON_CARD_TYPE.SAME_DECOR;
        } else if (this.isCommonStraight(cards)) {
            return COMMON_CARD_TYPE.STRAIGHT;
        } else if (this.isCommonLeopard(cards)) {
            return COMMON_CARD_TYPE.LEOPARD;
        } else if (this.isCommonTwoPair(cards)) {
            return COMMON_CARD_TYPE.TWO_PAIR;
        } else if (this.isCommonOnePair(cards)) {
            return COMMON_CARD_TYPE.ONE_PAIR;
        } else {
            return COMMON_CARD_TYPE.NONE;
        }
    }

    static getCommonMultiple(pierNum: number, cards: number[]) {
        if (this.isCommonSameDecorStraight(cards)) {
            if (pierNum == 1) {
                return 10;
            } else if (pierNum == 2) {
                return 5;
            }
        } else if (this.isCommonBomb(cards)) {
            if (pierNum == 1) {
                return 8;
            } else if (pierNum == 2) {
                return 4;
            }
        } else if (this.isCommonLeopard(cards)) {// && this.getCardValue(cards[0]) == 1) {
            if (pierNum == 0) {
                return 3;
            }
        } else if (this.isCommonGourd(cards)) {
            if (pierNum == 1) {
                return 2;
            }
        }
        return 1;
    }

    // 是否倒水
    static isPourWater(cards: number[][]) {
        var lastValue = 0;
        for (var i = 0; i < cards.length; ++i) {
            var value = this.getCommonSpecialValue(cards[i]);
            if (i == 0) {
                value = (value % 10000000) * 400 + Math.floor(value / 10000000) * 10000000;
            }
            if (value < lastValue) {
                return true;
            }
            lastValue = value;
        }
        return false;
    }

    static findAllStraight(cards: number[], len: number) {
        let dict = this.parseCardPointTable(cards);
        let head = null, tail = null;
        let res = [];
        for (let i = 2; i <= 14; ++i) {
            if (dict[i]) {
                if (head == null) {
                    head = i;
                }
                tail = i;
                if (tail - head + 1 >= len) {
                    res.push({begin: tail - len + 1, end: tail});
                }
            } else {
                head = tail = null;
            }
        }
        return res;
    }

    static findSameDecorStraight(cards: number[], len: number) {
        let straights = this.findAllStraight(cards, len);
        let dict = this.parseCardPointDecorTable(cards);
        let res = [];
        for (let straight of straights) {
            let begin = straight.begin;
            let end = straight.end;
            let decors = dict[end];
            for (let i = begin; i < end; ++i) {
                decors = GameUtil.unionList(decors, dict[i]);
            }
            for (let decor of decors) {
                let subRes = [];
                for (let point = begin; point <= end; ++point) {
                    let pokerId = this.changePointToPoker(point, decor);
                    subRes.push(pokerId);
                }
                res.push(subRes);
            }
        }
        return res;
    }

    static findBomb(cards: number[], len: number) {
        if (len < 4) {
            return [];
        }
        let res = [];
        let dict = this.parseCardPointTable(cards);
        for (let point in dict) {
            if (dict[point] >= 4) {
                let subRes = this.findCards(cards, [Number(point)], 4);
                res.push(subRes);
            }
        }
        return res;
    }

    static findGourd(cards: number[], len: number) {
        if (len < 5) {
            return [];
        }
        let res = [];
        let amount = this.parseCardPointAmountTable(cards);
        if (amount[3]) {
            if (amount[2]) {
                for (let point3 of amount[3]) {
                    for (let point2 of amount[2]) {
                        let three = this.findCards(cards, [point3], 3);
                        let pair = this.findCards(cards, [point2], 2);
                        if (three && pair) {
                            res.push(three.concat(pair));
                        }
                    }
                }
            }
            for (let point3 of amount[3]) {
                for (let point2 of amount[3]) {
                    if (point2 == point3) {
                        continue;
                    }
                    let three = this.findCards(cards, [point3], 3);
                    let pair = this.findCards(cards, [point2], 3);
                    if (three && pair) {
                        let list = GameUtil.oneUnionMulti(three, GameUtil.choose(pair, 2));
                        res = GameUtil.mergeList(res, list);
                    }
                }
            }
        }
        return res;
    }

    static findSameDecor(cards: number[], len: number) {
        let res = [];
        let dict = this.parseCardDecorPokerTable(cards);
        for (let decor = 1; decor <= 4; ++decor) {
            if (dict[decor] && dict[decor].length >= len) {
                res = GameUtil.mergeList(res, GameUtil.choose(dict[decor], len));
            }
        }
        return res;
    }

    static findStraight(cards: number[], len: number) {
        let straights = this.findAllStraight(cards, len);
        let dict = this.parseCardPointPokerTable(cards);
        let res = [];
        for (let straight of straights) {
            let begin = straight.begin;
            let end = straight.end;
            let subRes = GameUtil.oneUnionList([], dict[end]);
            for (let i = begin; i < end; ++i) {
                subRes = GameUtil.listUnionMulti(subRes, dict[i]);
            }
            res = GameUtil.mergeList(res, subRes);
        }
        return res;
    }

    static findLeopard(cards: number[], len: number) {
        let amount = this.parseCardPointAmountTable(cards);
        let res = [];
        if (amount[3]) {
            for (let point of amount[3]) {
                let three = this.findCards(cards, [point], 3);
                res.push(three);
            }
        }
        return res;
    }

    static findTwoPair(cards: number[], len: number) {
        if (len < 4) {
            return [];
        }
        let amount = this.parseCardPointAmountTable(cards);
        let points: number[] = [];
        for (let i = 2; i <= 3; ++i) {
            if (amount[i]) {
                points = GameUtil.mergeList(points, amount[i]);
            }
        }
        if (points.length >= 2) {
            let pairs = [];
            for (let point of points) {
                pairs.push(this.findCards(cards, [point], 2));
            }
            let res = GameUtil.choose(pairs, 2);
            for (let i = 0; i < res.length; ++i) {
                res[i] = GameUtil.mergeList(res[i][0], res[i][1]);
            }
            return res;
        }
        return [];
    }

    static findOnePair(cards: number[], len: number) {
        if (len < 4) {
            return [];
        }
        let amount = this.parseCardPointAmountTable(cards);
        let points: number[] = [];
        for (let i = 2; i <= 3; ++i) {
            if (amount[i]) {
                points = GameUtil.mergeList(points, amount[i]);
            }
        }
        let pairs = [];
        for (let point of points) {
            pairs.push(this.findCards(cards, [point], 2));
        }
        return pairs;
    }

    static findCardsByType(cards: number[], type: number, len: number) {
        switch (type) {
            case COMMON_CARD_TYPE.SAME_DECOR_STRAIGHT:
                return this.findSameDecorStraight(cards, len);
            case COMMON_CARD_TYPE.BOMB:
                return this.findBomb(cards, len);
            case COMMON_CARD_TYPE.GOURD:
                return this.findGourd(cards, len);
            case COMMON_CARD_TYPE.SAME_DECOR:
                return this.findSameDecor(cards, len);
            case COMMON_CARD_TYPE.STRAIGHT:
                return this.findStraight(cards, len);
            case COMMON_CARD_TYPE.LEOPARD:
                return this.findLeopard(cards, len);
            case COMMON_CARD_TYPE.TWO_PAIR:
                return this.findTwoPair(cards, len);
            case COMMON_CARD_TYPE.ONE_PAIR:
                return this.findOnePair(cards, len);
            case 0:
                return [[]];
            default:
                return [];
        }
    }

    static getTipCard(holds: number[]) {
        let res = [];
        let specialType = this.getSpecialCardType(holds);
        if (specialType) {
            let data = {
                special: specialType,
                combineCards: this.getSortSpecialCard(holds, specialType),
            }
            res.push(data);
        }
        for (let i = 17; i >= 10; --i) {
            let tails = this.findCardsByType(holds, i, 5);
            for (let tail of tails) {
                let excludeTail = GameUtil.subList(holds, tail);
                for (let j = i; j >= 10; --j) {
                    let middles = this.findCardsByType(excludeTail, j, 5);
                    for (let middle of middles) {
                        if (i == j && this.getCommonSpecialValue(tail) < this.getCommonSpecialValue(middle)) {
                            continue;
                        }
                        let excludeMiddle = GameUtil.subList(excludeTail, middle);
                        for (let k = j; k >= 0; k == 10 ? k = 0 : --k) {
                            let heads = this.findCardsByType(excludeMiddle, k, 3);
                            for (let head of heads) {
                                if (j == k && this.getCommonSpecialValue(middle) < this.getCommonSpecialValue(head)) {
                                    continue;
                                }
                                let left = GameUtil.subList(excludeMiddle, head);
                                let _tail = GameUtil.deepClone(tail);
                                let _middle = GameUtil.deepClone(middle);
                                if (_tail.length < 5) {
                                    while (_tail.length < 5) {
                                        _tail.push(left.pop());
                                    }
                                    if (this.getCommonCardType(_tail) > i) {
                                        continue;
                                    }
                                }
                                if (_middle.length < 5) {
                                    while (_middle.length < 5) {
                                        _middle.push(left.pop());
                                    }
                                    if (this.getCommonCardType(_middle) > j) {
                                        continue;
                                    }
                                }
                                if (head.length < 3) {
                                    while (head.length < 3) {
                                        head.push(left.pop());
                                    }
                                    if (this.getCommonCardType(head) > k) {
                                        continue;
                                    }
                                }
                                this.sortCardByPoint(head);
                                this.sortCardByPoint(_middle);
                                this.sortCardByPoint(_tail);
                                let data = {
                                    head: k,
                                    middle: j,
                                    tail: i,
                                    combineCards: [head, _middle, _tail]
                                }
                                res.push(data);
                            }
                        }
                    }
                }
            }
        }
        return res;
    }
}