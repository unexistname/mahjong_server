import PokerCardPointMgr from "../../../Base/PokerCardPointMgr";


export default class ZJHCardPointMgr extends PokerCardPointMgr {
    
    
    static getMixCardPoint(cards: number[]) {
        return super.getMixCardPoint(cards, 100);
    }

    //顺子
    static isStraight(cards: number[]) {
        return super.isStraight(cards, true);
    }

    // 同花顺
    static isSameDecorStraight(cards: number[]) {
        if (!this.isSameDecor(cards)) {
            return false;
        }
        if (!this.isStraight(cards)) {
            return false;
        }
        return true;
    }

    static compare(holds1: number[], holds2: number[]) {
        if (this.isSpecialCard(holds1) && this.isLeopard(holds2)) return 1;
        if (this.isSpecialCard(holds2) && this.isLeopard(holds1)) return -1;
        let point1 = this.calculate(holds1);
        let point2 = this.calculate(holds2);
        if (point1 > point2) {
            return 1;
        } else if (point1 == point2) {
            return 0;
        } else {
            return -1;
        }
    }

    static isSpecialCard(cards: number[]) {
        let dict = this.parseCardValueTable(cards);
        if (!dict[2] || !dict[3] || !dict[5]) {
            return false;
        }

        let decorDict: { [key: number]: boolean } = {};
        for (let card of cards) {
            let decor = this.getCardDecor(card);
            if (decorDict[decor]) return false;
            decorDict[decor] = true;
        }
        return true;
    }
    
    static isPair(cards: number[]) {
        let dict = this.parseCardValueTable(cards);
        for (let i = 1; i <= 13; ++i) {
            if (dict[i] && dict[i] >= 2) {
                return true;
            }
        }
        return false;
    }
    
    static getPairPoint(cards: number[]) {
        let dict = this.parseCardPointTable(cards);
        let pairValue;
        for (let i = 14; i > 1; --i) {
            if (dict[i] >= 2) {
                pairValue = i;
                break;
            }
        }
        if (pairValue == null) return 0;
    
        var point = pairValue * 100 + pairValue;
    
        for (let i = 14; i > 1; --i) {
            if (i == pairValue) continue;
            while (dict[i] && dict[i] > 0) {
                --dict[i];
                point = point * 100 + i;
            }
        }
        
        return point;
    }
    
    static calculate(cards: number[]) {
        if (this.isLeopard(cards)) {
            return 9000000 + this.getMixCardPoint(cards);
        }
        if (this.isSameDecorStraight(cards)) {
            return 8000000 + this.getMixCardPoint(cards);
        }
        if (this.isSameDecor(cards)) {
            return 7000000 + this.getMixCardPoint(cards);
        }
        if (this.isStraight(cards)) {
            return 6000000 + this.getMixCardPoint(cards);
        }
        if (this.isPair(cards)) {
            return 5000000 + this.getPairPoint(cards);;
        }
        return this.getMixCardPoint(cards);
    }
    
    static getCardType(cards: number[]) {
        if (this.isLeopard(cards)) {
            return 15;
        }
        if (this.isSameDecorStraight(cards)) {
            return 14;
        }
        if (this.isSameDecor(cards)) {
            return 13;
        }
        if (this.isStraight(cards)) {
            return 12;
        }
        if (this.isPair(cards)) {
            return 11;
        }
        return 0;
    }
}