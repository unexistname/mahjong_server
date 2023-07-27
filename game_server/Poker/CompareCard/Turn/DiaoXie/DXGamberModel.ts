
import GamberModel from "../../../../Game/GamberModel";

export default class DXGamberModel extends GamberModel {
    scoreReverse: number;
    compensate: number = 0;

    reset() {
        super.reset();
        this.scoreReverse = 0;
    }
}