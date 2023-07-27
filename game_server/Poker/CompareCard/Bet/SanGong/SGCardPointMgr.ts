import PokerCardPointMgr from "../../../Base/PokerCardPointMgr";


export default class SGCardPointMgr extends PokerCardPointMgr {
    
    // 大三公
    static isBigThreeGrand(cards: number[]) {
        if (!this.isLeopard(cards)) return false;
        var value = this.getCardValue(cards[0]);
        if (value < 11) return false;
        return true;
    }

    // 小三公
    static isSmallThreeGrand(cards: number[]) {
        if (!this.isLeopard(cards)) return false;
        var value = this.getCardValue(cards[0]);
        if (value > 10) return false;
        return true;
    }

    // 混三公
    static isMixThreeGrand(cards: number[]) {
        var cardValue, isMix = false;
        for (var i = 0; i < cards.length; ++i) {
            var value = this.getCardValue(cards[i]);
            if (value < 11) return false;
            if (cardValue == null) cardValue = value;
            else if (cardValue != value) isMix = true;
        }
        return isMix;
    }

    
    static getMixCardPoint(cards: number[]) {
        var point = 0;
        for (var i = 0; i < cards.length; ++i) {
            var value = this.getCardValue(cards[i]);
            if (value < 10) point += value;
        }
        point %= 10;
        return point;
    }

    static getMaxCardValue(cards: number[]) {
        var maxValue = 0;
        for (var i = 0; i < cards.length; ++i) {
            var value = this.getCardValue(cards[i]);
            if (value > maxValue) maxValue = value;
        }
        return maxValue;
    }

    static getMaxCardDecor(cards: number[]) {
        var maxValue = 0;
        var maxDecor = 99;  // 花色类型越小，对应的值越大
        for (var i = 0; i < cards.length; ++i) {
            var decor = this.getCardDecor(cards[i]);
            var value = this.getCardValue(cards[i]);
            if (value > maxValue || (value == maxValue && decor < maxDecor)) {
                maxValue = value;
                maxDecor = decor;
            }
        }
        return maxDecor;
    }

    static getDecorPoint(decor: number) {
        return (4 - decor);
    }

    static getGrandNum(cards: number[]) {
        var grandNum = 0;
        for (var i = 0; i < cards.length; ++i) {
            if (this.getCardValue(cards[i]) > 10) {
                grandNum++;
            }
        }
        return grandNum;
    }

    static getCardTypeFactor(cards: number[]) {
        if (this.isBigThreeGrand(cards)) {
            return 9;
        }
        if (this.isSmallThreeGrand(cards)) {
            return 7;
        }
        if (this.isMixThreeGrand(cards)) {
            return 5;
        }
        if (this.getMixCardPoint(cards) >= 8) {
            return 3;
        }
        return 1;
    }

    static getCardType(cards: number[]) {
        if (this.isBigThreeGrand(cards)) {
            return 12;
        } else if (this.isSmallThreeGrand(cards)) {
            return 11;
        } else if (this.isMixThreeGrand(cards)) {
            return 10;
        } else {
            return this.getMixCardPoint(cards);
        }
    }

    static calculate(cards: number[]) {
        if (this.isBigThreeGrand(cards)) {
            return 300000 + this.getCardValue(cards[0]);
        }
        if (this.isSmallThreeGrand(cards)) {
            return 200000 + this.getCardValue(cards[0]);
        }
        if (this.isMixThreeGrand(cards)) {
            return 100000 + this.getMaxCardValue(cards) * 10 + this.getDecorPoint(this.getMaxCardDecor(cards));
        }
        return this.getMixCardPoint(cards) * 10000 + this.getGrandNum(cards) * 1000 + this.getMaxCardValue(cards) * 10 + this.getDecorPoint(this.getMaxCardDecor(cards));
    }
}