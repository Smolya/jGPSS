class Queue {
    constructor() {
        this._in = [];
        this._out = [];
        this._count = 0;
        this._maxCount = 0;
        this._entry = 0;
        this._transactCount = [];
    }

    pushIn(time) {
        this._in.push(time);
        this._count++;
        this._entry++;

        this._transactCount.push(this._count);

        if (this._count > this._maxCount) {
            this._maxCount = this._count;
        }
    }

    pushOut(time) {
        this._out.push(time);
        this._count--;
    }

    _averageTime() {
        const diff = this._in.map((item, i) => Math.abs(item - (this._out[i] || 480)));

        return diff.reduce((sum, cur) => sum + cur, 0) / diff.length;
    }

    _averageCount() {
        return this._transactCount.reduce((sum, cur) => sum + cur, 0)/this._transactCount.length
    }

    results() {
        return {
            entry: this._entry,
            currentCount: this._count,
            maxCount: this._maxCount,
            averageTime: this._averageTime(),
            count: this._averageCount(),
        }
    }
}

module.exports = Queue;