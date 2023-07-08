

export default class TimerTask {
    timerId: any;
    callback: any;

    // constructor(callback: Function, time: number) {
    //     this.beginTask(callback, time);
    // }

    beginTask(callback: Function, time: number) {
        this.clearTask();
        this.callback = callback;
        this.timerId = setTimeout(() => {
            this.doTask();
        }, time * 1000);
    }

    clearTask(force: boolean = true) {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        if (force) {
            this.callback = null;
        }
    }

    doTask() {
        this.clearTask(false);
        this.callback && this.callback();
        this.callback = null;
    }
}