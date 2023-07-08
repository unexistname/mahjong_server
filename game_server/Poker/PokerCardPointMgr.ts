import { PokerCardDecor } from "./PokerCardDecor";


export default class PokerCardPointMgr {
    
    // 获取花色
    static getCardDecor(card: number) {
        return card % 10;
    }

    // 获取牌的值
    static getCardValue(card: number) {
        return Math.floor(card / 10);
    }

    // 获取牌的点数
    static getCardPoint(card: number) {
        let point = Math.floor(card / 10);
        return point == 1 ? 14 : point;
    }

    static getCard(decor: PokerCardDecor, value: number) {
        return value * 10 + decor;
    }

    static isRedCard(card: number) {
        let decor = this.getCardDecor(card);
        return decor == PokerCardDecor.HEART || decor == PokerCardDecor.BLOCK;
    }

    static isBlackCard(card: number) {
        let decor = this.getCardDecor(card);
        return decor == PokerCardDecor.SPADE || decor == PokerCardDecor.PLUM;
    }

    static isCard(card: number, targetCardValue: number, targetPokerCardDecor?: PokerCardDecor) {
        if (this.getCardValue(card) != targetCardValue) return false;
        if (targetPokerCardDecor != null) {
            if (this.getCardDecor(card) != targetPokerCardDecor) return false;
        }
        return true;
    }

    static hasCard(cards: number[], targetCardValue: number, targetPokerCardDecor?: PokerCardDecor) {
        for (let i = 0; i < cards.length; ++i) {
            if (this.isCard(cards[i], targetCardValue, targetPokerCardDecor)) {
                return true;
            }
        }
        return false;
    }
    
    static parseCardValueTable(cards: number[]) {
        let dict: {[key:number]: number} = {};
        for (let card of cards) {
            let value = this.getCardValue(card);
            dict[value] = dict[value] ? dict[value] + 1 : 1;
        }
        return dict;
    }
    
    static parseCardDecorTable(cards: number[]) {
        let dict: {[key:number]: number} = {};
        for (let card of cards) {
            let value = this.getCardDecor(card);
            dict[value] = dict[value] ? dict[value] + 1 : 1;
        }
        return dict;
    }
    
    static parseCardPointTable(cards: number[]) {
        let dict: {[key:number]: number} = {};
        for (let card of cards) {
            let value = this.getCardPoint(card);
            dict[value] = dict[value] ? dict[value] + 1 : 1;
        }
        return dict;
    }

    static parseCardCntTable(dict: {[key: number]: number}) {
        let cnt: {[key: number]: number} = {};
        for (let value in dict) {
            cnt[dict[value]] = cnt[dict[value]] ? (cnt[dict[value]] + 1) : 1;
        }
        return cnt;
    }

    static getSameCardValueCnt(cards: number[]) {
        let dict = this.parseCardPointTable(cards);
        let cnt = this.parseCardCntTable(dict);
        return cnt;
    }

    static parseCardValueAmountTable(cards: number[]) {
        let dict: {[key:number]: number} = this.parseCardValueTable(cards);
        let amount: {[key: number]: number[] } = {};
        for (let value in dict) {
            if (!amount[dict[value]]) {
                amount[dict[value]] = [];
            }
            amount[dict[value]].push(Number(value));
        }
        return amount;
    }

    static parseCardPointAmountTable(cards: number[]) {
        let dict = this.parseCardPointTable(cards);
        let amount: {[key: number]: number[] } = {};
        for (let point in dict) {
            if (!amount[dict[point]]) {
                amount[dict[point]] = [];
            }
            amount[dict[point]].push(Number(point));
        }
        return amount;
    }
    
    static getMixCardPoint(cards: number[], gap: number = 20) {
        if (!cards) return 0;
        let dict = this.parseCardPointTable(cards);
    
        let point = 0;
        for (let i = 14; i > 1; --i) {
            while (dict[i] && dict[i] > 0) {
                --dict[i];
                point = point * gap + i;
            }
        }
        return point;
    }

    //顺子
    static isStraight(cards: number[], canA23: boolean = false, canQKA: boolean = true) {
        var dict: { [key: number]: boolean } = {};
        var minValue = 99;
        var maxValue = 0;
        for (let card of cards) {
            let value = this.getCardPoint(card);
            if (value < minValue) {
                minValue = value;
            }
            if (value > maxValue) {
                maxValue = value;
            }
            if (dict[value]) {  // 有对子或者豹子，肯定不是顺子
                return false;
            }
            dict[value] = true;
        }
        
        if ((maxValue - minValue + 1) == cards.length) {    // 234 ~ QKA
            if (canQKA || !dict[14]) {
                return true;
            }
        }

        if (canA23 && dict[14]) {
            for (let i = 1; i < cards.length; ++i) {
                if (!dict[i + 1]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    //同花
    static isSameDecor(cards: number[]) {
        let decor;
        for (let card of cards) {
            let type = this.getCardDecor(card);
            if(decor == null){
                decor = type;
            } else if(type != decor){
                return false;
            }
        }
        return true;
    }
    
    // 豹子
    static isLeopard(cards: number[]) {
        let firstValue;
        for (let card of cards) {
            let value = this.getCardPoint(card);
            if (firstValue == null) {
                firstValue = value;
            } else if (value != firstValue) {
                return false;
            }
        }
        return true;
    }
}