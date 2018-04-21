const Transact = require('./transactus');

class Block {
    constructor(label) {
        this.label = label;
        this.entry = 0;
    }

    _enterAtBlock() {
        this.entry++;
    }
}

class ADVANCE extends Block {
    constructor(label) {
        super(label);
    }

    /**
     * Выполнение транзакта
     * @param transact
     * @param currentModelTime
     * @param time
     */
    execute(transact, time, currentModelTime) {
        this._enterAtBlock();
        transact.time = currentModelTime + time();

        transact.currentBlock = transact.nextBlock - 1;
        transact.goToNextBlock();

        return {
            isNextBlock: false,
            isAdvance: true,
        };
    }
}

class ASSIGN extends Block {
    constructor(label) {
        super(label);
    }

    /**
     * @param transact  объект транзакта
     * @param param     параметр транзакта
     * @param value     устанавливаемое значение
     * @param mode      '-' / '+'
     */
    execute(transact, param, value, mode) {
        this._enterAtBlock();

        if (mode === '-') {
            transact.params[param] -= (typeof value === 'function' ? value() : value);

        } else if (mode === '+') {
            transact.params[param] += (typeof value === 'function' ? value() : value);
        } else {
            transact.params[param] = typeof value === 'function' ? value() : value;
        }

        transact.goToNextBlock();
        return {
            isNextBlock: true,
        };
    }
}

class DEPART extends Block {
    constructor(label) {
        super(label);
    }

    /**
     * Убрать транзакт из очереди
     * @param transact
     * @param queue
     * @param time
     * @returns {{isNextBlock: boolean}}
     */
    execute(transact, queue, time) {
        this._enterAtBlock();

        queue.pushOut(time);

        transact.goToNextBlock();

        return {
            isNextBlock: true,
        };
    }
}

class ENTER extends Block {
    constructor(label) {
        super(label);
    }

    /**
     * Занять устройство
     * @param transact
     * @param storage
     * @returns {{delay: boolean, isNextBlock: boolean}}
     */
    execute(transact, storage) {
        let isNextBlock = true;
        let delay = false;

        if (storage.isFull()) {
            this._enterAtBlock();
            transact.goToNextBlock();
            storage.enterDev();
        } else {
            delay = true;
            isNextBlock = false;
        }

        return {
            delay,
            isNextBlock,
        };
    }
}

class LEAVE extends Block {
    constructor(label) {
        super(label);
    }

    /**
     * Освободить устройство
     * @param transact
     * @param storage
     * @returns {{isNextBlock: boolean, isLeave: boolean}}
     */
    execute(transact, storage) {
        this._enterAtBlock();

        storage.leaveDev();
        transact.goToNextBlock();

        return {
            isNextBlock: true,
            isLeave: true,
        };
    }
}

class GENERATE extends Block {
    constructor(label) {
        super(label);
    }

    /**
     * Генерация нового транзакта
     * @param idTransact    номер создаваемого транзакта
     * @param idBlock       номер текущего блока
     * @param currentModelTime текущее модельное время
     * @param A             средний интервал между транзактами
     * @param D             число проходящих транзактов через блок GENERATE
     */
    execute(idTransact, idBlock, currentModelTime, A = 1, D = 1) {
        const newTransact = [];

        let id = idTransact;
        for (let i = 0; i < D; i++) {
            const interval = typeof A === 'function' ? A() : A;
            newTransact.push(new Transact(interval + currentModelTime, id, idBlock));
            this.entry++;
            id++;
        }

        return newTransact;
    }
}

class LINK extends Block {
    constructor(label) {
        super(label);
    }

    /**
     * Перенос транзакта в список пользователя
     * @param transact
     * @param list
     */
    execute(transact, list) {
        this._enterAtBlock();

        transact.goToNextBlock();
        list.push(transact);

        return {
            isNextBlock: true
        };
    }
}


class UNLINK extends Block {
    constructor(label) {
        super(label);
    }

    /**
     * Возврат транзака из списка пользователя в модель
     * @param transact
     * @param list
     * @param label
     * @returns {{idOldTransact: *, newTransact: T, isNextBlock: boolean, label: *}}
     */
    execute(transact, list, label) {
        this._enterAtBlock();

        const {
            id,
            currentBlock,
            nextBlock
        } = transact;

        const newTransact = list.shift();

        newTransact.currentBlock = currentBlock + 1;
        newTransact.nextBlock = nextBlock + 1;

        //console.log('UNLINK!', newTransact);
        return {
            idOldTransact: id,
            newTransact,
            isNextBlock: true,
            label,
        }
    }
}

class QUEUE extends Block {
    constructor(label) {
        super(label);
    }

    /**
     * Добавить транзакт в очередь
     * @param transact
     * @param queue
     * @param time
     * @returns {{isNextBlock: boolean}}
     */
    execute(transact, queue, time) {
        this._enterAtBlock();

        queue.pushIn(time);

        transact.goToNextBlock();

        return {
            isNextBlock: true,
        };
    }
}

class TEST extends Block {
    constructor(label) {
        super(label);
    }

    /**
     * Проверка значений
     * @param transact
     * @param mode
     * @param a
     * @param b
     * @param label
     * @returns {*}
     */
    execute(transact, mode, a, b, label) {
        this._enterAtBlock();

        let isTest = false;

        switch (mode) {
            case 'E':
                isTest = transact.params[a] === transact.params[b];
                break;
            case 'G':
                isTest = transact.params[a] > transact.params[b];
                break;
        }

        if (isTest) {
            transact.goToNextBlock();
            return {
                isNextBlock: true,
            }
        } else {
            return {
                isNextBlock: true,
                label,
            }
        }
    }
}

class TERMINATE extends Block {
    constructor(label) {
        super(label);
    }

    /**
     * Вывод транзакта из модели
     * @returns {{isNextBlock: boolean}}
     */
    execute() {
        this._enterAtBlock();

        return {
            isNextBlock: false,
        };
    }
}

class TRANSFER extends Block {
    constructor(label) {
        super(label);
    }

    /**
     * Безусловный переход
     * @param transact
     * @param label
     * @returns {{isNextBlock: boolean, label: *}}
     */
    execute(transact, label) {
        this._enterAtBlock();

        return {
            isNextBlock: true,
            label,
        }
    }
}


module.exports = {
    ADVANCE,
    ASSIGN,
    DEPART,
    ENTER,
    GENERATE,
    LEAVE,
    LINK,
    QUEUE,
    TERMINATE,
    TEST,
    TRANSFER,
    UNLINK,
};
