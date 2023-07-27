import { PokerCardDecor } from "../../../Base/PokerCardDecor";
import PokerCardPointMgr from "../../../Base/PokerCardPointMgr";


export default class DXCardPointMgr extends PokerCardPointMgr {

    // 获取牌的点数
    static getCardPoint(card: number) {
        if (this.isCard(card, 2, PokerCardDecor.GHOST)) return 6;
        return this.getCardValue(card);
    }

    // 是否是皇帝对
    static isKingPair(cards: number[]) {
        // 钓蟹只有2张牌
        if (cards.length != 2) return false;
        if (cards[0] == cards[1]) return false;
        if (!this.hasCard(cards, 2, PokerCardDecor.GHOST)) return false;
        if (!this.hasCard(cards, 3, PokerCardDecor.SPADE)) return false;
        return true;
    }

    // 是否是对子
    static isPair(cards: number[]) {
        if (cards.length != 2) return false;
        if (cards[0] == cards[1]) return false;
        if (this.getCardValue(cards[0]) != this.getCardValue(cards[1])) return false;
        if (this.isRedCard(cards[0]) && this.isRedCard(cards[1])) return true;
        if (this.isBlackCard(cards[0]) && this.isBlackCard(cards[1])) return true;
        return false;
    }

    // 天对
    static isSkyPair(cards: number[]) {
        if (cards.length != 2) return false;
        if (!this.isPair(cards)) return false;
        return this.getCardValue(cards[0]) == 12;
    }

    // 地对
    static isEarthPair(cards: number[]) {
        if (cards.length != 2) return false;
        if (!this.isPair(cards)) return false;
        return this.getCardValue(cards[0]) == 2;
    }

    // 人对
    static isHumanPair(cards: number[]) {
        if (cards.length != 2) return false;
        if (!this.isPair(cards)) return false;
        if (!this.isRedCard(cards[0])) return false;
        return this.getCardValue(cards[0]) == 8;
    }

    // 鹅对/和对
    static isGoosePair(cards: number[]) {
        if (cards.length != 2) return false;
        if (!this.isPair(cards)) return false;
        if (!this.isRedCard(cards[0])) return false;
        return this.getCardValue(cards[0]) == 4;
    }

    // 板凳对+梅花对+长三对
    static isBenchPair(cards: number[]) {
        if (cards.length != 2) return false;
        if (!this.isPair(cards)) return false;
        if (!this.isBlackCard(cards[0])) return false;
        let cardValue = this.getCardValue(cards[0]);
        return cardValue == 4 || cardValue == 6 || cardValue == 10;
    }

    // 斧头对+红头对+霖六对+脚七对
    static isAxePair(cards: number[]) {
        if (cards.length != 2) return false;
        if (!this.isPair(cards)) return false;
        if (!this.isRedCard(cards[0])) return false;
        let cardValue = this.getCardValue(cards[0]);
        return cardValue == 6 || cardValue == 7 || cardValue == 10 || cardValue == 11;
    }

    // 鸡仔对+红根对+风吹对
    static isWindPair(cards: number[]) {
        if (cards.length != 2) return false;
        if (!this.isPair(cards)) return false;
        let cardValue = this.getCardValue(cards[0]);
        if (this.isRedCard(cards[0])) {
            return cardValue == 5 || cardValue == 9;
        } else {
            return cardValue == 7 || cardValue == 8;
        }
    }

    // 天九王
    static isSkyNine(cards: number[]) {
        if (cards.length != 2) return false;
        if (this.getCardValue(cards[0]) == this.getCardValue(cards[1])) return false;
        if (!this.hasCard(cards, 12)) return false;
        if (!this.hasCard(cards, 9)) return false;
        return true;
    }

    // 地九王
    static isEarthNine(cards: number[]) {
        if (cards.length != 2) return false;
        if (this.getCardValue(cards[0]) == this.getCardValue(cards[1])) return false;
        if (!this.hasCard(cards, 2)) return false;
        if (!this.hasCard(cards, 9)) return false;
        return true;
    }

    // 天杠
    static isSkyBar(cards: number[]) {
        if (cards.length != 2) return false;
        if (this.getCardValue(cards[0]) == this.getCardValue(cards[1])) return false;
        if (!this.hasCard(cards, 12)) return false;
        if (!this.hasCard(cards, 8)) return false;
        return true;
    }

    // 地杠
    static isEarthBar(cards: number[]) {
        if (cards.length != 2) return false;
        if (this.getCardValue(cards[0]) == this.getCardValue(cards[1])) return false;
        if (!this.hasCard(cards, 2)) return false;
        if (!this.hasCard(cards, 8)) return false;
        return true;
    }

    // 计算杂牌点数
    static getMixCardPoint(cards: number[]) {
        if (cards.length != 2) return -1;
        let cardValue = this.getCardPoint(cards[0]) + this.getCardPoint(cards[1]);
        return cardValue % 10;
    }

    static calculate(cards: number[]) {
        if (this.isKingPair(cards)) return 1000;
        if (this.isSkyPair(cards)) return 990;
        if (this.isEarthPair(cards)) return 980;
        if (this.isHumanPair(cards)) return 970;
        if (this.isGoosePair(cards)) return 960;
        if (this.isBenchPair(cards)) return 950;
        if (this.isAxePair(cards)) return 940;
        if (this.isWindPair(cards)) return 930;
        if (this.isSkyNine(cards)) return 800;
        if (this.isEarthNine(cards)) return 790;
        if (this.isSkyBar(cards)) {
            return 750;
            // if (this.getCardValue(cards[0]) == 8) {
            //     if (this.isRedCard(cards[0])) {
            //         return 760;
            //     } else {
            //         return 750;
            //     }
            // } else {
            //     if (this.isRedCard(cards[1])) {
            //         return 760;
            //     } else {
            //         return 750;
            //     }
            // }
        }
        if (this.isEarthBar(cards)) {
            return 650;
            // if (this.getCardValue(cards[0]) == 8) {
            //     if (this.isRedCard(cards[0])) {
            //         return 660;
            //     } else {
            //         return 650;
            //     }
            // } else {
            //     if (this.isRedCard(cards[1])) {
            //         return 660;
            //     } else {
            //         return 650;
            //     }
            // }
        }
        let point = this.getMixCardPoint(cards);
        point = point * 10;
        if (this.hasCard(cards, 12)) {
            point = point + 9;
        } else if (this.hasCard(cards, 2)) {
            point = point + 8;
        } else if (this.hasCard(cards, 8, PokerCardDecor.HEART) || this.hasCard(cards, 8, PokerCardDecor.BLOCK)) {
            point = point + 7;
        } else if (this.hasCard(cards, 4, PokerCardDecor.HEART) || this.hasCard(cards, 4, PokerCardDecor.BLOCK)) {
            point = point + 6;
        } else if (this.hasCard(cards, 4, PokerCardDecor.SPADE) || this.hasCard(cards, 4, PokerCardDecor.PLUM)) {
            point = point + 5;
        } else if (this.hasCard(cards, 6, PokerCardDecor.SPADE) || this.hasCard(cards, 6, PokerCardDecor.PLUM)) {
            point = point + 5;
        } else if (this.hasCard(cards, 10, PokerCardDecor.SPADE) || this.hasCard(cards, 10, PokerCardDecor.PLUM)) {
            point = point + 5;
        } else if (this.hasCard(cards, 6, PokerCardDecor.HEART) || this.hasCard(cards, 6, PokerCardDecor.BLOCK)) {
            point = point + 3;
        } else if (this.hasCard(cards, 7, PokerCardDecor.HEART) || this.hasCard(cards, 7, PokerCardDecor.BLOCK)) {
            point = point + 3;
        } else if (this.hasCard(cards, 10, PokerCardDecor.HEART) || this.hasCard(cards, 10, PokerCardDecor.BLOCK)) {
            point = point + 3;
        } else if (this.hasCard(cards, 11)) {
            point = point + 3;
        } else if (this.hasCard(cards, 5)) {
            point = point + 1;
        } else if (this.hasCard(cards, 9)) {
            point = point + 1;
        } else if (this.hasCard(cards, 7, PokerCardDecor.SPADE) || this.hasCard(cards, 7, PokerCardDecor.PLUM)) {
            point = point + 1;
        } else if (this.hasCard(cards, 8, PokerCardDecor.SPADE) || this.hasCard(cards, 8, PokerCardDecor.PLUM)) {
            point = point + 1;
        }
        return point;
    }

    static getCardStringValue(hold: number) {
        var value = Math.floor(hold / 10);
        if(value == 10){
            return "X";
        }
        else if(value == 11){
            return "J";
        }
        else if(value == 12){
            return "Q";
        }
        else if(value == 13){
            return "K";
        }
        else{
            return "" + value;
        }
    }
    
    static getCardType(holds: number[]) {
        const CARD_TYPE = [
            "2Jr", "2Qr", "2Xm", "2Xr", "3Qm", "4Qm", "4Qr", "5Qr", "6Qm", "6Qr", 
            "7Qm", "7Qr", "8Qb", "8Qm", "8Qr", "9Qb", "9Qm", "9Qr", "13b", "22b",
            "23m", "24m", "24r", "25r", "26m", "26r", "27m", "27r", "28b", "28m",
            "28r", "44b", "44m", "44r", "45r", "55r", "66b", "66r", "77b", "77r",
            "88b", "88r", "99r", "b3r4", "JJr", "JQr", "QQr", "r4b8", "r4J", "r4X",
            "r47", "r49", "XQm", "XQr", "XXb", "XXr"
        ];
        holds.sort(function(a, b) { return a - b });
        let name = "";
        for (let hold of holds) {
            name += this.getCardStringValue(hold);
        }
        let aRed = this.isRedCard(holds[0]);
        let bRed = this.isRedCard(holds[1]);
        let color = "m";
        if (aRed && bRed) {
            color = "r";
        } else if (!aRed && !bRed) {
            color = "b";
        }

        let aColor = aRed ? "r": "b";
        let bColor = bRed ? "r": "b";

        if (CARD_TYPE.indexOf(name + color) >= 0){
            return name + color;
        } else if (CARD_TYPE.indexOf(name) >= 0) {
            return name;
        } else if (CARD_TYPE.indexOf(aColor + name) >= 0) {
            return aColor + name;
        } else if (CARD_TYPE.indexOf(aColor + name.charAt(0) + bColor + name.charAt(1)) >= 0) {
            return aColor + name.charAt(0) + bColor + name.charAt(1);
        } else {
            return "dx_" + this.getMixCardPoint(holds);
        }
    }
}