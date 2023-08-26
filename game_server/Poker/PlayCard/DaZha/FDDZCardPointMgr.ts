import GameUtil from "../../../../utils/GameUtil";
import { PokerCardDecor } from "../../Base/PokerCardDecor";
import PlayPokerCardPointMgr, { CARD_TYPE } from "../Base/PlayPokerCardPointMgr";


export default class FDDZCardPointMgr extends PlayPokerCardPointMgr {

    static getLegalCardTypes() {
        return [
            CARD_TYPE.BOMB,
            CARD_TYPE.SINGLE,
            CARD_TYPE.PAIR,
            CARD_TYPE.THREE,
            CARD_TYPE.SINGLE_STRAIGHT,
            CARD_TYPE.PAIR_STRAIGHT,
            CARD_TYPE.THREE_STRAIGHT,
        ]
    }

    static is510K(cards: number[]) {
        if (cards.length != 3) {
            return false;
        }
        let dict = this.parseCardPointTable(cards);
        return dict[5] && dict[10] && dict[13];
    }

    static isGhostBomb(cards: number[]) {
        if (cards.length > 8) {
            return false;
        }
        let dict = this.parseCardDecorTable(cards);
        if (!dict[PokerCardDecor.GHOST]) {
            return false;
        }
        if (dict[PokerCardDecor.GHOST] == cards.length && cards.length >= 3) {
            return true;
        }

        let commonCardAmount = cards.length - dict[PokerCardDecor.GHOST];
        if (commonCardAmount < 3) {
            // 至少三个相同的牌才能配鬼牌
            return false;
        }
        dict = this.parseCardPointTable(cards);
        for (let i in dict) {
            if (dict[i] == commonCardAmount) {
                return true;
            }
        }
        return false;
    }

    static isSingleStraight(cards: number[]) {
        let cnt = this.getSameCardValueCnt(cards);
        return cnt[1] == cards.length && cnt[1] == 5 && this.isStraight(cards);
    }

    static isBomb(cards: number[]) {
        if (this.is510K(cards)) {
            return true;
        }
        if (this.isGhostBomb(cards)) {
            return true;
        }
        if (this.isCommonBomb(cards)) {
            return true;
        }
        return false;
    }

    static getBombValue(cards: number[]) {
        if (this.is510K(cards)) {
            if (this.isSameDecor(cards)) {
                let decorPoint = 4 - this.getCardDecor(cards[0]);
                return 3100 + decorPoint;
            } else {
                return 3000;
            }
        } else if (this.isLeopard(cards)) {
            if (this.isGhost(cards[0])) {
                if (cards.length == 3) {
                    return 6000;
                } else if (cards.length == 4) {
                    return 7000;
                }
            } else {
                let point = this.getCardPoint(cards[0]);
                return cards.length * 1000 + point;
            }
        } else if (this.isGhostBomb(cards)) {
            cards.sort(this.isBetterCard.bind(this));
            let point = this.getCardPoint(cards[cards.length - 1]);
            return cards.length * 1000 + point;
        }
        return 0;
    }

    static find510K(holds: number[]) {
        let dict = this.parseCardPointTable(holds);
        if (dict[5] && dict[10] && dict[13]) {
            return this.findCards(holds, [5, 10, 13], 1);
        }
    }

    static findBomb(holds: number[]) {
        return this.find510K(holds) || this.findMinLeopard(holds, 4);
    }

    static findBetterBomb(folds: number[], holds: number[]) {
        let dict = this.parseCardPointTable(holds);
        let amount = this.parseCardPointAmountTable(holds);
        let bombVal = this.getBombValue(folds);
        let len = Math.floor(bombVal / 1000);
        let minPoint = bombVal % 1000;
        let ghostLen = (dict[16] || 0) + (dict[17] || 0);
        for (let i = Math.max(len, 4); i <= 8; ++i) {
            if (amount[i]) {
                for (let point of amount[i]) {
                    if (point > minPoint || i > len) {
                        return this.findCards(holds, [point], i);
                    }
                }
            }
        }
        if (ghostLen >= 3) {
            if (6000 > bombVal) {
                return this.findCards(holds, [16], 3);
            }
            if (ghostLen == 4 && 7000 > bombVal) {
                return this.findCards(holds, [16], 4);
            }
        }
        if (ghostLen > 0) {
            for (let i = 3; i <= 8; ++i) {
                if (amount[i]) {
                    for (let point of amount[i]) {
                        if (point > minPoint || (i + ghostLen) > len) {
                            let card = this.findCards(holds, [point], i);
                            let ghost: number[] = [];
                            if (dict[16]) {
                                let smallGhost = this.findCards(holds, [16], dict[16]);
                                if (smallGhost) {
                                    ghost = GameUtil.mergeList(ghost, smallGhost);
                                }
                            }
                            if (dict[17]) {
                                let bigGhost = this.findCards(holds, [17], dict[17]);
                                if (bigGhost) {
                                    ghost = GameUtil.mergeList(ghost, bigGhost);
                                }
                            }
                            return card && GameUtil.mergeList(card, ghost);
                        }
                    }
                }
            }
        }
    }

    static getBonusFactor(cards: number[]) {
        let bombLen = cards.length;
        if (this.isLeopard(cards)) {
            if (this.isGhost(cards[0])) {
                if (bombLen >= 3) {
                    return 1 << (bombLen - 2);
                }
            } else if (this.getCardPoint(cards[0]) == 15) {
                if (bombLen >= 4) {
                    return 1 << (bombLen - 4);
                }
            } else if (bombLen >= 5) {
                return 1 << (bombLen - 5);
            }
        } else {
            if (bombLen >= 5) {
                let dict = this.parseCardPointTable(cards);
                for (let point in dict) {
                    let amount = dict[point];
                    if (Number(point) < 16) {
                        if (Number(point) == 15) {
                            if (amount >= 4) {
                                return 1 << (amount - 4);
                            }
                        } else {
                            if (amount >= 5) {
                                return 1 << (amount - 5);
                            }
                        }
                    }
                }
            }
        }
        return 0;
    }
}