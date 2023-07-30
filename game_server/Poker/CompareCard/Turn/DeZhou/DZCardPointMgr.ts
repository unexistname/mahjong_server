import PokerCardPointMgr from "../../../Base/PokerCardPointMgr";
import DZGamberModel from "./DZGamberModel";
import DZGameMgr from "./DZGameMgr";

    
let CARD_TYPE = {
    ROYAL_SAME_DECOR_STRAIGHT: 19,
    SAME_DECOR_STRAIGHT: 18,
    BOMB: 17,
    GOURD: 16,
    SAME_DECOR: 15,
    STRAIGHT: 14,
    LEOPARD: 13,
    TWO_PAIR: 12,
    ONE_PAIR: 11,
}

export default class DZCardPointMgr extends PokerCardPointMgr {
    
    static getPairCardPoint(cards: number[]) {    
        let amount: {[key: number]: number[] } = this.parseCardPointAmountTable(cards);
    
        var point = 0;
        for (var i = 4; i >= 1; --i) {
            if (!amount[i]) continue;
            for (var j = 14; j > 1; --j) {
                if (this.findArrData(amount[i], j) < 0) continue;
                for (var k = 0; k < i; ++k) {
                    point = point * 20 + j;
                }
            }
        }
        return point;
    }
    
    static getCardType(game: DZGameMgr, cards: number[]) {
        let holds: number[] = [];
        holds = holds.concat(cards);
        holds = holds.concat(game.commonHolds);
    
        var tryCards = this.trySameDecorStraight(holds);
        if (tryCards) {
            for (let i = 0; i < cards.length; i++) {
                let value = this.getCardPoint(cards[i]);
                if (value == 14) {
                    return CARD_TYPE.ROYAL_SAME_DECOR_STRAIGHT;
                }
            }
            return CARD_TYPE.SAME_DECOR_STRAIGHT;
        }
        tryCards = this.tryBomb(holds);
        if (tryCards) {
            return CARD_TYPE.BOMB;
        }
        tryCards = this.tryGourd(holds);
        if (tryCards) {
            return CARD_TYPE.GOURD;
        }
        tryCards = this.trySameDecor(holds);
        if (tryCards) {
            return CARD_TYPE.SAME_DECOR;
        }
        tryCards = this.tryStraight(holds);
        if (tryCards) {
            return CARD_TYPE.STRAIGHT;
        }
        tryCards = this.tryLeopard(holds);
        if (tryCards) {
            return CARD_TYPE.LEOPARD;
        }
        tryCards = this.tryTwoPair(holds);
        if (tryCards) {
            return CARD_TYPE.TWO_PAIR;
        }
        tryCards = this.tryOnePair(holds);
        if (tryCards) {
            return CARD_TYPE.ONE_PAIR;
        }
        return 0;
    }
    
    static calculate(game: DZGameMgr, cards: number[]) {
        var holds: number[] = [];
        holds = holds.concat(cards);
        holds = holds.concat(game.commonHolds);
    
        var tryCards = this.trySameDecorStraight(holds);
        if (tryCards) {
            return 90000000 + this.getPairCardPoint(tryCards);
        }
        tryCards = this.tryBomb(holds);
        if (tryCards) {
            return 80000000 + this.getPairCardPoint(tryCards);
        }
        tryCards = this.tryGourd(holds);
        if (tryCards) {
            return 70000000 + this.getPairCardPoint(tryCards);
        }
        tryCards = this.trySameDecor(holds);
        if (tryCards) {
            return 60000000 + this.getPairCardPoint(tryCards);
        }
        tryCards = this.tryStraight(holds);
        if (tryCards) {
            return 50000000 + this.getPairCardPoint(tryCards);
        }
        tryCards = this.tryLeopard(holds);
        if (tryCards) {
            return 40000000 + this.getPairCardPoint(tryCards);
        }
        tryCards = this.tryTwoPair(holds);
        if (tryCards) {
            return 30000000 + this.getPairCardPoint(tryCards);
        }
        tryCards = this.tryOnePair(holds);
        if (tryCards) {
            return 20000000 + this.getPairCardPoint(tryCards);
        }
        tryCards = this.tryMixCard(holds);
        if (tryCards) {
            return 10000000 + this.getPairCardPoint(tryCards);
        }
        return this.getMixCardPoint(holds);
    }
    
    static getTryCards(game: DZGameMgr, cards: number[]) {
        var holds: number[] = [];
        holds = holds.concat(cards);
        holds = holds.concat(game.commonHolds);
    
        var tryCards = this.trySameDecorStraight(holds);
        if (tryCards) {
            return tryCards;
        }
        tryCards = this.tryBomb(holds);
        if (tryCards) {
            return tryCards;
        }
        tryCards = this.tryGourd(holds);
        if (tryCards) {
            return tryCards;
        }
        tryCards = this.trySameDecor(holds);
        if (tryCards) {
            return tryCards;
        }
        tryCards = this.tryStraight(holds);
        if (tryCards) {
            return tryCards;
        }
        tryCards = this.tryLeopard(holds);
        if (tryCards) {
            return tryCards;
        }
        tryCards = this.tryTwoPair(holds);
        if (tryCards) {
            return tryCards;
        }
        tryCards = this.tryOnePair(holds);
        if (tryCards) {
            return tryCards;
        }
        return this.tryMixCard(holds);
    }
    
    static trySameDecorStraight(cards: number[]) {
        let dict: {[key:number]: number} = this.parseCardValueTable(cards);
        var res = [];
        for (var decor = 1; decor < 4; ++decor) {
            var cnt = 0;
            for (var point = 14; point >= 2; --point) {
                var value = (point > 13) ? (point - 13) : point;
                var card = value * 10 + decor;
                if (dict[card]) {
                    cnt++;
                    res.push(card);
                    if (cnt == 5) {
                        return res;
                    }
                } else {
                    cnt = 0;
                    res = [];
                }
            }
        }
    }
    
    static tryBomb(cards: number[]) {
        let dict: {[key:number]: number} = this.parseCardValueTable(cards);

        let bomb;
        for (let value in dict) {
            if (dict[value] == 4) {
                bomb = Number(value);
                break;
            }
        }
        if (bomb) {     // 有炸弹
            for (var i = 14; i > 1; --i) {
                let value = (i > 13) ? (i - 13) : i;
                if (value == bomb) {
                    continue;
                }
                if (dict[value]) {  // 再找一张杂牌
                    var res = [];
                    var hasMix = false;
                    for (var i = 0; i < cards.length; ++i) {
                        var value2 = this.getCardValue(cards[i]);
                        if (value2 == bomb) {
                            res.push(cards[i]);
                        } else if (value2 == value) {
                            if (!hasMix) {
                                res.push(cards[i]);
                            }
                            hasMix = true;
                        }
                    }
                    return res;
                }
            }
        }
    }
    
    static tryGourd(cards: number[]) {
        let dict: {[key:number]: number} = this.parseCardValueTable(cards);
        let cnt = this.parseCardCntTable(dict);
        var three, two;
        if (cnt[3] && cnt[2]) {
            for (var i = 14; i > 1; --i) {
                var value = (i > 13) ? (i - 13) : i;
                if (dict[value] == 2) {
                    if (!two) {
                        two = value;
                    }
                }
                if (dict[value] == 3) {
                    if (!three) {
                        three = value;
                    }
                }
            }
            var res = [];
            for (var i = 0; i < cards.length; ++i) {
                var value = this.getCardValue(cards[i]);
                if (value == two || value == three) {
                    res.push(cards[i]);
                }
            }
            return res;
        }
    }
    
    static trySameDecor(cards: number[]) {
        var dict: {[key: number]: number} = {};
        for (var i = 0; i < cards.length; ++i) {
            var decor = this.getCardDecor(cards[i]);
            dict[decor] = dict[decor] ? (dict[decor] + 1) : 1;
        }
        for (var decor = 1; decor <= 4; ++decor) {
            if (dict[decor] && dict[decor] >= 5) {
                var res2 = [];
                for (var i = 0; i < cards.length; ++i) {
                    if (this.getCardDecor(cards[i]) == decor) {
                        res2.push(cards[i]);
                    }
                }
                var res = [];
                for (var point = 14; point > 1; --point) {
                    var value = (point > 13) ? (point - 13) : point;
                    var card = value * 10 + decor;
                    if (this.findArrData(res2, card) >= 0) {
                        res.push(card);
                        if (res.length == 5) {
                            return res;
                        }
                    }
                }
            }
        }
    }
    
    static tryStraight(cards: number[]) {
        let dict: {[key:number]: number} = this.parseCardValueTable(cards);
        var cnt = 0;
        for (var point = 14; point > 1; --point) {
            var value = (point > 13) ? (point - 13) : point;
            if (dict[value]) {
                cnt++;
                if (cnt == 5) {
                    var res = [];
                    for (var item = point; item < point + 5; ++item){
                        for (var i = 0; i < cards.length; ++i) {
                            if (this.getCardValue(cards[i]) == item) {
                                res.push(cards[i]);
                                break;
                            }
                        }
                    }
                    return res;
                }
            } else {
                cnt = 0;
            }
        }
    }
    
    static tryLeopard(cards: number[]) {
        let dict: {[key:number]: number} = this.parseCardValueTable(cards);
        for (var value in dict) {
            if (dict[value] == 3) {
                var mix = [];
                for (var point = 14; point > 1; --point) {
                    let v = (point > 13) ? (point - 13) : point;
                    if (v == Number(value)) continue;
                    if (dict[v] == 1) {
                        mix.push(v);
                        if (mix.length >= 2) {
                            break;
                        }
                    }
                }
                var res = [];
                for (var i = 0; i < cards.length; ++i) {
                    let v = this.getCardValue(cards[i]);
                    if (v == Number(value)) {
                        res.push(cards[i]);
                    } else if (this.findArrData(mix, v) >= 0) {
                        res.push(cards[i]);
                    }
                }
                return res;
            }
        }
    }
    
    static tryTwoPair(cards: number[]) {
        let dict: {[key:number]: number} = this.parseCardValueTable(cards);
        var cnt = this.parseCardCntTable(dict);
        if (cnt[2] >= 2) {
            var mix;
            var pair = [];
            for (var point = 14; point > 1; --point) {
                var value = (point > 13) ? (point - 13) : point;
                if (!dict[value]) continue;
                if (dict[value] == 2) {
                    if (pair.length < 2) {
                        pair.push(value);
                    }
                } else if (dict[value] == 1) {
                    if (mix == null) {
                        mix = value;
                    }
                }
            }
            
            var res = [];
            for (var i = 0; i < cards.length; ++i) {
                var value = this.getCardValue(cards[i]);
                if (value == mix) {
                    res.push(cards[i]);
                    mix = null;
                } else if (this.findArrData(pair, value) >= 0) {
                    res.push(cards[i]);
                }
            }
            return res;
        }
    }
    
    static findArrData(arr: any[], value: any) {
        var index = arr.indexOf("" + value);
        if (index < 0) {
            index = arr.indexOf(value);
        }
        return index;
    }
    
    static tryOnePair(cards: number[]) {
        let dict: {[key:number]: number} = this.parseCardValueTable(cards);
        var cnt = this.parseCardCntTable(dict);
        if (cnt[2] >= 1) {
            var mix = [];
            var pair;
            for (var point = 14; point > 1; --point) {
                var value = (point > 13) ? (point - 13) : point;
                if (!dict[value]) continue;
                if (dict[value] == 2) {
                    if (pair == null) {
                        pair = value;
                    }
                } else if (dict[value] == 1) {
                    if (mix.length < 3) {
                        mix.push(value);
                    }
                }
            }
            
            var res = [];
            for (var i = 0; i < cards.length; ++i) {
                var value = this.getCardValue(cards[i]);
                if (value == pair) {
                    res.push(cards[i]);
                } else if (this.findArrData(mix, value) >= 0) {
                    res.push(cards[i]);
                }
            }
            return res;
        }
    }
    
    static tryMixCard(cards: number[]) {
        var dict: {[key: number]: number} = {};
        var map: {[key: number]: number} = {};
        for (var i = 0; i < cards.length; ++i) {
            var value = this.getCardValue(cards[i]);
            dict[value] = dict[value] ? (dict[value] + 1) : 1;
            map[value] = cards[i];
        }
        var res = [];
        for (var point = 14; point > 1; --point) {
            var value = (point > 13) ? (point - 13) : point;
            if (dict[value]) {
                res.push(map[value]);
                if (res.length == 5) {
                    return res;
                }
            }
        }
    }
    
    static compareDecor(cardA: number, cardB: number) {
        let decorA = this.getCardDecor(cardA);
        let decorB = this.getCardDecor(cardB);
        return decorA - decorB;
    }
    
    static compareCards(cardsA: number[], cardsB: number[]) {
        let sortFunc = (a: number, b: number) => { return this.getCardPoint(b) - this.getCardPoint(a); };
        cardsA.sort(sortFunc);
        cardsB.sort(sortFunc);
        for (let i = 0; i < cardsA.length; i++) {
            let cardA = cardsA[i];
            let cardB = cardsB[i];
            if (this.getCardPoint(cardA) != this.getCardPoint(cardB)) {
                return this.getCardPoint(cardB) - this.getCardPoint(cardA);
            }
        }
        for (let i = 0; i < cardsA.length; i++) {
            let cardA = cardsA[i];
            let cardB = cardsB[i];
            let cmp = this.compareDecor(cardA, cardB);
            if (cmp != 0) {
                return cmp;
            }
        }
        return 0;
    }
    
    static better(gamberA: DZGamberModel, gamberB: DZGamberModel) {
        if (gamberA.tryCards && gamberB.tryCards) {
            let cmp = this.compareCards(gamberA.tryCards, gamberB.tryCards);
            if (cmp != 0) {
                return cmp > 0;
            }
        }
        return this.compareCards(gamberA.holds, gamberB.holds);
    }
    
}