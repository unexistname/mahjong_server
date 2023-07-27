

export default class GamberModel {
    userId: string;
    seatIndex: number;
    holds: number[];
    scoreRobBanker: number | null = null;
    scoreBegin: number = 0;
    scoreBetting: number;
    scoreBettings: number[];
    eliminate: boolean;
    waive: boolean;
    hasBetting: boolean;
    cardValue: number;
    operates: any[];
    cardType: any;
    score: number = 0;
    isNew: boolean = true;

    reset() {
        // this.seatIndex = -1;
        this.holds = [];
        this.scoreRobBanker = null;
        this.scoreBetting = 0;
        this.scoreBettings = [];
        this.waive = false;
        this.eliminate = false;
        this.hasBetting = false;
        this.operates = [];
        this.cardType = null;
    }

    addCard(card: number) {
        this.holds.push(card);
    }

    hasCard(card: number) {
        return this.holds.indexOf(card) >= 0;
    }

    discard(card: number) {
        let index = this.holds.indexOf(card);
        if (index >= 0) {
            this.holds.splice(index, 1);
        }
    }

    discards(cards: number[]) {
        for (let card of cards) {
            this.discard(card);
        }
    }
}