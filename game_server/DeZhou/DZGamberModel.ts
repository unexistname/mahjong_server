import GamberModel from "../Game/GamberModel";


export default class DZGamberModel extends GamberModel {
    scoreLast: number = 0;
    tryCards: number[] | undefined;

    reset(): void {
        super.reset();
        this.scoreLast = 0;
        this.tryCards = undefined;
    }
}