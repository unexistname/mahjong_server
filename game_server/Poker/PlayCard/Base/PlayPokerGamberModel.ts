import GamberModel from "../../../Game/GamberModel";

export default class PlayPokerGamberModel extends GamberModel {
    pointCards: number[] = [];
    scorePoint: number = 0;
    scoreBonus: number = 0;

    reset(): void {
        super.reset();
        this.pointCards = [];
        this.scorePoint = 0;
        this.scoreBonus = 0;
    }
}