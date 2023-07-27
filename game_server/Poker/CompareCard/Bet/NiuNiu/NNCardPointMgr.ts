import PokerCardPointMgr from "../../../Base/PokerCardPointMgr";


export default class NNCardPointMgr extends PokerCardPointMgr {
    
    //顺子
    static checkShunzi(cards: number[]) {
        return this.isStraight(cards, true, false);
    }
    //同花
    static checkTonghua(cards: number[]) {
        return this.isSameDecor(cards);
    }
    //葫芦牛
    static checkHulu(cards: number[]) {
        let dict = this.parseCardValueTable(cards);
        var count = [];
        for (var i in dict) {
            count.push(dict[i]);
        }
        if(count.length == 2 && (count[0] == 3 || count[1] == 3)){
            return true;
        }
        return false;
    }
    //炸弹牛
    static checkZhadan(cards: number[]) {
        let dict = this.parseCardValueTable(cards);
        var count = [];
        for (var i in dict) {
            count.push(dict[i]);
        }
        if(count.length == 2 && (count[0] == 4 || count[1] == 4)){
            return true;
        }
        return false;
    }
    //五小牛
    static checkWuxiao(cards: number[]) {
        var total = 0;
        for (let card of cards) {
            total += this.getCardValue(card);
        }
        if(total <= 10)return true;
        return false;
    }
    //五花牛
    static checkWuhua(cards: number[]) {
        var isWuhuaniu = true;
        for (let card of cards) {
            if(card <= 104){
                isWuhuaniu = false;
            }
        }
        return isWuhuaniu;
    }

    //计算最终为牛几
    static calculate(cards: number[]) {
        var isShunzi = this.checkShunzi(cards);
        var isTonghua = this.checkTonghua(cards);
        if(isShunzi && isTonghua)return 17;
        if(this.checkZhadan(cards))return 16;
        if(this.checkWuhua(cards))return 15;
        if(this.checkWuxiao(cards))return 14;
        if(this.checkHulu(cards))return 13;
        if(isTonghua)return 12;
        if(isShunzi)return 11;

        var s = 0;
        let dict: {[key:number]: number} = {};
        for (let card of cards) {
            var ci = Math.floor(card / 10);
            if(ci > 10)ci = 10;
            s += ci;
            dict[ci] = dict[ci] === undefined ? 1 : dict[ci] + 1;
        };
        var point = s % 10;

        var exists = false;
        for (var key in dict) {
            let value = Number(key);
            var other = (10 + point - value) % 10;
            if(other == 0)other = 10;
            if (dict[other]) {
                if ((other == value && dict[other] >= 2) || (other!=value&&dict[other] >= 1)) {
                    exists = true;
                    break;
                }
            }
        }
        if(point == 0){
            point = 10;
        }
        return exists ? point : 0;
    }

    static typeResult(point: number){
        var beishu = 1;
        if(point == 7 || point == 8){
            beishu = 2;
        }
        else if(point == 9){
            beishu = 3;
        }
        else if(point == 10){
            beishu = 4;
        }
        else if(point > 10){
            beishu = 5;
        }
        return beishu;
    }

    static compare(holds1: number[], holds2: number[], point: number){
        //葫芦和炸弹特殊
        if(point == 13 || point == 15){
            let dict1 = this.parseCardValueTable(holds1);
            var hold1 = 0;
            var count1 = 0;
            for (let i in dict1) {
                if(dict1[i] > count1){
                    count1 = dict1[i];
                    hold1 = Number(i);
                }
            }
            let dict2 = this.parseCardValueTable(holds2);
            var hold2 = 0;
            var count2 = 0;
            for (let i in dict2) {
                if(dict2[i] > count2){
                    count2 = dict2[i];
                    hold2 = Number(i);
                }
            }
            return hold1 - hold2;
        }
        var maxType1 = 0;
        var maxValue1 = 0;
        var maxType2 = 0;
        var maxValue2 = 0;
        for(let i=0;i<holds1.length;i++){
            var value = Math.floor(holds1[i] / 10);
            var type = holds1[i] % 10;
            if(value > maxValue1){
                maxValue1 = value;
                maxType1 = type;
            } else if(value == maxValue1 && type < maxType1){
                maxType1 = type;
            }
        }
        for(var i=0;i<holds2.length;i++){
            var value = Math.floor(holds2[i] / 10);
            var type = holds2[i] % 10;
            if(value > maxValue2){
                maxValue2 = value;
                maxType2 = type;
            } else if(value == maxValue2 && type < maxType2){
                maxType2 = type;
            }
        }
        if(maxValue1 > maxValue2){
            return 1;
        } else if(maxValue1 == maxValue2){
            if(maxType1 < maxType2){
                return 1;
            } else {
                return -1;
            }
        } else {
            return -1;
        }
    }
}