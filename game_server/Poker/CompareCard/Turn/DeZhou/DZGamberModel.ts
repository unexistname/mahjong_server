import GamberModel from "../../../../Game/GamberModel";


export default class DZGamberModel extends GamberModel {
    tryCards: number[] | undefined;

    reset(): void {
        super.reset();
        this.tryCards = undefined;
    }
}