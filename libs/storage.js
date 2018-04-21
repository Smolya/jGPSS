class Storage {
    constructor(size) {
        this.size = size;
        this._used = 0;
        this._unused = this.size;

        this._entries = 0;
        this._usedCount = [];
    }

    enterDev() {
        this._used++;
        this._entries++;

        this._usedCount.push(this._used);
        this._unused--;
    }

    leaveDev() {
        this._used--;
        this._unused++;
    }

    isFull() {
        return this._used !== this.size;
    }

    _averageCount() {
        return this._usedCount.reduce((sum, cur) => sum + cur, 0)/this._usedCount.length;
    }

    results() {
        return {
            entries: this._entries,
            averageCount: this._averageCount(),
        };
    }
}

module.exports = Storage;