import { ErrorCode } from "../game_server/ErrorCode";
import { Conditions } from "./Conditions";
import GameUtil from "./GameUtil";

export function ConditionFilter(condition: ErrorCode, ...args: any[]) {

    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        let oldMethod = descriptor.value;        
        descriptor.value = function(this, ...args2: any) {
            let errorCocde = Conditions[condition](this, ...args, ...args2);
            if (!GameUtil.isSuccessCode(errorCocde)) {
                return errorCocde;
            } else {
                return oldMethod.call(this, ...args2) || ErrorCode.SUCCESS;
            }
        }
        return descriptor;
        // return {
        //     enumerable: descriptor.enumerable,
        //     writable: descriptor.writable,
        //     configurable: descriptor.configurable,
        //     get() {
        //         const fn = ((...args2: any) => {
        //             let errorCocde = Conditions[condition](this, ...args, ...args2);
        //             if (errorCocde) {
        //                 return errorCocde;
        //             } else {
        //                 console.log("调用方法", propertyKey, oldMethod);
        //                 return oldMethod.bind(this)(...args2) || ErrorCode.SUCCESS;
        //             }
        //         }).bind(this);
        //         descriptor.value = fn;
        //         return fn;
        //     }
        // }
    }
}


// export function ConditionFilter(target: any, propName: string, descriptor: PropertyDescriptor) {
//     let oldMethod = descriptor.value;
//     descriptor.value = () => {
//         let conditionKey = arguments[0];
//         let args: any[] = [];
//         for (let i = 1; i < arguments.length; ++i) {
//             args.push(arguments[i]);
//         }
//         let errorCocde = Conditions[conditionKey](...args, ...args2);
//     };
//     return function(_class: any, _funcName: string, descriptor: PropertyDescriptor) {
//         return {
//             ...descriptor,
//             value: function(...args2: any[]) {
//                 let errorCocde = Conditions[condition](...args1, ...args2);
//                 return errorCocde ? errorCocde : descriptor.value(...args2);
//             }
//         }
//     }
// }