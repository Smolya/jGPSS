class Transact {
    constructor(time, idTransact, idBlock) {
        this.id = idTransact;
        this.time = time;
        this.currentBlock = idBlock;
        this.nextBlock = this.currentBlock + 1;
        this.params = {};
    }

    goToNextBlock() {
        this.currentBlock++;
        this.nextBlock++;
    }
}

module.exports = Transact;