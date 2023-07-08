import { ErrorCode } from "../game_server/ErrorCode"


export default class GameUtil {
    static isArr = (origin: any): boolean => {
        let str = '[object Array]'
        return Object.prototype.toString.call(origin) == str ? true : false
    }

    static deepClone( obj: any ) {
        if( obj === null ) return null;

        let o;
        if ( typeof obj == "object" ) {
            o = obj.constructor === Array ? [] : {};
            for ( let i in obj ) {
                if( obj.hasOwnProperty( i ) ) {
                    // @ts-ignore
                    o[ i ] = typeof obj[ i ] === "object" ? this.deepClone( obj[ i ] ) : obj[ i ];
                }
            }
        } else {
            o = obj;
        }
        return o;
    }

    static swap(arr: any, index: number, anotherIndex: number) {
        let tmp = arr[index];
        arr[index] = arr[anotherIndex];
        arr[anotherIndex] = tmp;
    }
    
    static random(n: number, m: number = 0) {
        let min, max;
        if (m == 0) {
            min = 0;
            max = n;
        } else {
            min = n;
            max = m;
        }
        let range = max - min;
        let ranValue = min + Math.round(Math.random() * range);
        return ranValue;
    }

    static getRandomNumbers(len: number) {
        let result = "";
        for(let i = 0; i < len; ++i){
            result += Math.floor(Math.random() * 10);
        }
        return result;
    }

    static mergeDict(dictA: any, dictB: any) {
        if (dictB == null) {
            return dictA;
        } else if (dictA == null) {
            return dictB;
        }
        return Object.assign({}, dictA, dictB);
    }

    static mergeList(listA: any[], listB: any[]) {
        if (listB == null) {
            return listA;
        } else if (listA == null) {
            return listB;
        }
        return listA.concat(listB);
    }

    static isSuccessCode(code: any) {
        return code == null || code == ErrorCode.SUCCESS;
    }

    static getEnumKeyByEnumValue(enumType: any, enumValue: any) {
        if (enumValue instanceof Number) {
            // @ts-ignore
            return enumType[enumValue];
        }
        let keys = Object.keys(enumType).filter(x => enumType[x] == enumValue);
        return keys.length > 0 ? keys[0] : null;
    }
}