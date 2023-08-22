import PDKCardPointMgr from "./PDKCardPointMgr";

export default class PDKCardPointMgr2 extends PDKCardPointMgr {
    
    static isBomb(cards: number[]) {
        if (this.isLeopard(cards)) {
            if (cards.length >= 4) {
                return true;
            }
        }
        return false;
    }

    static findBomb(holds: number[]) {
        let amount = this.parseCardPointAmountTable(holds);
        if (amount[4]) {
            return this.findCards(holds, [amount[4][0]], 4);
        }
    }

    static getBombValue(cards: number[]) {
        if (this.isLeopard(cards)) {
            if (cards.length >= 4) {
                return 1000 * this.getCardPoint(cards[0]);
            }
        }
        return 0;
    }
}