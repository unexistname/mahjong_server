

export default class LogUtil {
    
    static debug(...args: any[]) {
        console.log(...args);
    }
    
    static warn(...args: any[]) {
        console.warn(...args);
    }

    static error(...args: any[]) {
        console.error(...args);
    }
}