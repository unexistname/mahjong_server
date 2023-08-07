import GamberModel from "../../../../Game/GamberModel";


export default class SSSGamberModel extends GamberModel {
    useSpecialCard: boolean = false;
    combineCards: number[][] | number[];
    shoot: string[];
    tipCards: any;

    reset(): void {
        super.reset();
        this.useSpecialCard = false;
        this.combineCards = [];
        this.shoot = [];
        this.tipCards = null;
    }
}