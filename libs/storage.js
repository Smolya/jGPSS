class Storage {
    constructor(size) {
        this.size = size;
        this._used = 0;
        this._unused = this.size;

        this._entries = 0;
        this._usedCount = [];
        this._util = [];
    }

    enterDev() {
        this._used++;
        this._entries++;

        this._util.push(this._used/this.size);

        this._usedCount.push(this._used);
        this._unused--;
    }

    leaveDev() {
        this._used--;
        this._unused++;
    }

    isFull() {
        return this._used + 1 !== this.size;
    }

    _averageCount() {
        return this._usedCount.reduce((sum, cur) => sum + cur, 0)/this._usedCount.length;
    }

    util() {
        return this._util.reduce((sum, cur) => sum + cur, 0)/this._util.length;
    }

    results() {
        return {
            entries: this._entries,
            averageCount: this._averageCount(),
            util: this.util(),
        };
    }
}

module.exports = Storage;