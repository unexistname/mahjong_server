import GamberModel from "../../../../Game/GamberModel";


export default class ZJHGamberModel extends GamberModel {
    watchCardRound: number | null;

    reset(): void {
        super.reset();
        this.watchCardRound = null;
    }
}