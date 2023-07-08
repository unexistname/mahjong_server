import GameUtil from "../../utils/GameUtil";
import { PokerCardDecor } from "../Poker/PokerCardDecor";

export default class CardMgr {

    currentIndex: number;
    cardHeap: number[];
    lossNum: number = 0;

    constructor() {
        this.cardHeap = this.generateCards();
        this.currentIndex = 0;
    }

    shuffle() {
        for( let i = 0; i < this.cardHeap.length; ++i ) {
            let lastIndex = this.cardHeap.length - 1 - i;
            let index = GameUtil.random(lastIndex);
            let t = this.cardHeap[ index ];
            this.cardHeap[ index ] = this.cardHeap[ lastIndex ];
            this.cardHeap[ lastIndex ] = t;
        }
        console.log("[当前牌堆]", this.cardHeap);
    }

    drawCard(isReverse: boolean = false) {
        if (!this.canDrawCard()) {
            return;
        }
        if (isReverse) {
            let tmp = this.cardHeap[this.currentIndex];
            this.cardHeap[this.currentIndex] = this.cardHeap[this.cardHeap.length - 1];
            this.cardHeap[this.cardHeap.length - 1] = tmp;
        }
        let card = this.cardHeap[this.currentIndex];
        this.currentIndex++;
        return card;
    }

    canDrawCard() {
        return this.currentIndex + this.lossNum < this.cardHeap.length;
    }

    getLeftCardNum() {
        return this.cardHeap.length - this.currentIndex;
    }

    getLeftCards() {
        let cards = [];
        for (let i = this.currentIndex; i < this.cardHeap.length; ++i) {
            cards.push(this.cardHeap[i]);
        }
        return cards;
    }

    getCardIndexInHeap(card: number) {
        for (let i = this.currentIndex; i < this.cardHeap.length; ++i) {
            if (this.cardHeap[i] == card) {
                return i;
            }
        }
        return -1;
    }

    generateCards() {
        let cards = [];
        for (let i = 1; i <= 13; ++i) {
            cards.push(this.createPokerCard(PokerCardDecor.HEART, i));
            cards.push(this.createPokerCard(PokerCardDecor.BLOCK, i));
            cards.push(this.createPokerCard(PokerCardDecor.SPADE, i));
            cards.push(this.createPokerCard(PokerCardDecor.PLUM, i));
        }
        // cards.push(this.createPokerCard(PokerCardDecor.GHOST, 1));  // 小王
        // cards.push(this.createPokerCard(PokerCardDecor.GHOST, 2));  // 大王
        return cards; 
    }

    createPokerCard(decor: PokerCardDecor, value: number) {
        return (value * 10) + decor;
    }

    sortCard(holds: number[], huns: number[] = []) {
        holds.sort((a, b) => {
            let aIndex = huns.indexOf(a);
            let bIndex = huns.indexOf(b);
            if (aIndex >= 0 && bIndex >= 0) {
                return a - b;
            }
            if (aIndex >= 0) return -1;
            if (bIndex >= 0) return 1;
            return a - b;
        });
    }
}