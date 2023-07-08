import GamberModel from "../Game/GamberModel";


export default class ZJHGamberModel extends GamberModel {
    watchCardRound: number | null;
    waive: boolean;

    reset(): void {
        super.reset();
        this.watchCardRound = null;
        this.waive = false;
    }
}