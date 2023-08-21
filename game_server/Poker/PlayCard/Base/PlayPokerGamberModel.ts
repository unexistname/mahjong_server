import GamberModel from "../../../Game/GamberModel";
import { PlayPokerFoldType } from "./PlayPokerFoldType";

export default class PlayPokerGamberModel extends GamberModel {
    pointCards: number[] = [];
    scorePoint: number = 0;
    scoreBonus: number = 0;
    folds: number[] = [];
    foldType: PlayPokerFoldType;

    reset(): void {
        super.reset();
        this.folds = [];
        this.pointCards = [];
        this.scorePoint = 0;
        this.scoreBonus = 0;
        this.foldType = PlayPokerFoldType.NONE;
    }

    getHoldsByIndexs(indexs: number[]) {
        let cards = [];
        if (indexs) {
            for (let index of indexs) {
                cards.push(this.holds[index]);
            }
        }
        return cards;
    }
}