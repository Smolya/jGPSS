const _ = require('lodash');

const {DUniform, Exponential} = require('./libs/distribution');
const Blocks = require('./libs/blocks');
const Storage = require('./libs/storage');
const Queue = require('./libs/queue');

let CCE = [];
let CFE = [];
const FREE = [];

const CARS = new Storage(3);

const QRequest = new Queue();
const QWaitCar = new Queue();
const QTripTime = new Queue();

const WORKING_DAY_TIME = 6;

function sortedByTime(CFE) {
    return _.sortBy(CFE, (transact) => transact.time);
}

(function simulate() {
    let modelTime = 0;
    let idTransact = 0;

    const model = [
        {label: '',             name: 'GENERATE',   args: [0, CARS.size]},                              //0
        {label: '',             name: 'ASSIGN',     args: ['PosX', () => DUniform(1, 100), '']},        //1
        {label: '',             name: 'ASSIGN',     args: ['PosY', () => DUniform(1, 100), '']},        //2
        {label: '',             name: 'LINK',       args: [FREE]},                                      //3
        {label: '',             name: 'TERMINATE',  args: []},                                          //4
        {label: '',             name: 'GENERATE',   args: [() => Exponential(2)]},                      //5
        {label: '',             name: 'QUEUE',      args: [QRequest]},                                  //6
        {label: '',             name: 'QUEUE',      args: [QWaitCar]},                                  //7
        {label: '',             name: 'ENTER',      args: [CARS]},                                      //8
        {label: '',             name: 'DEPART',     args: [QRequest]},                                  //9
        {label: '',             name: 'UNLINK',     args: [FREE, 'GETNEWPOS']},                         //10
        {label: '',             name: 'TERMINATE',  args: []},                                          //11

        {label: 'GETNEWPOS',    name: 'ASSIGN',     args: ['PosXDest', () => DUniform(1, 100), '']},    //12
        {label: '',             name: 'ASSIGN',     args: ['PosYDest', () => DUniform(1, 100), '']},    //13
        {label: 'MOVEX',        name: 'TEST',       args: ['E', 'PosX', 'PosXDest', 'NOTEQX']},         //14
        {label: '',             name: 'TRANSFER',   args: ['MOVEY']},                                   //15
        {label: 'NOTEQX',       name: 'TEST',       args: ['G', 'PosX', 'PosXDest', 'LESSX']},          //16
        {label: '',             name: 'ASSIGN',     args: ['PosX', 1, '-']},                            //17
        {label: '',             name: 'TRANSFER',   args: ['DRIVEX']},                                  //18
        {label: 'LESSX',        name: 'ASSIGN',     args: ['PosX', 1, '+']},                            //19
        {label: 'DRIVEX',       name: 'ADVANCE',    args: [() => Exponential(5, 2)]},                   //20
        {label: '',             name: 'TRANSFER',   args: ['MOVEX']},                                   //21

        {label: 'MOVEY',        name: 'TEST',       args: ['E', 'PosY', 'PosYDest', 'NOTEQY']},         //22
        {label: '',             name: 'DEPART',     args: [QWaitCar]},                                  //23
        {label: '',             name: 'TRANSFER',   args: ['MOVEDEST']},                                //24
        {label: 'NOTEQY',       name: 'TEST',       args: ['G', 'PosY', 'PosYDest', 'LESSY']},          //25
        {label: '',             name: 'ASSIGN',     args: ['PosY', 1, '-']},                            //26
        {label: '',             name: 'TRANSFER',   args: ['DRIVEY']},                                  //27
        {label: 'LESSY',        name: 'ASSIGN',     args: ['PosY', 1, '+']},                            //28
        {label: 'DRIVEY',       name: 'ADVANCE',    args: [() => Exponential(5, 2)]},                   //29
        {label: '',             name: 'TRANSFER',   args: ['MOVEY']},                                   //30

        {label: 'MOVEDEST',     name: 'ASSIGN',     args: ['PosXDest2', () => DUniform(1, 100), '']},   //31
        {label: '',             name: 'ASSIGN',     args: ['PosYDest2', () => DUniform(1, 100), '']},   //32
        {label: '',             name: 'QUEUE',      args: [QTripTime]},                                 //33
        {label: 'MOVEX2',       name: 'TEST',       args: ['E', 'PosX', 'PosXDest2', 'NOTEQX2']},       //34
        {label: '',             name: 'TRANSFER',   args: ['MOVEY2']},                                  //35
        {label: 'NOTEQX2',      name: 'TEST',       args: ['G', 'PosX', 'PosXDest2', 'LESSX2']},        //36
        {label: '',             name: 'ASSIGN',     args: ['PosX', 1, '-']},                            //37
        {label: '',             name: 'TRANSFER',   args: ['DRIVEX2']},                                 //38
        {label: 'LESSX2',       name: 'ASSIGN',     args: ['PosX', 1, '+']},                            //39
        {label: 'DRIVEX2',      name: 'ADVANCE',    args: [() => Exponential(5, 2)]},                   //40
        {label: '',             name: 'TRANSFER',   args: ['MOVEX2']},                                  //41

        {label: 'MOVEY2',       name: 'TEST',       args: ['E', 'PosY', 'PosYDest2', 'NOTEQY2']},       //42
        {label: '',             name: 'DEPART',     args: [QTripTime]},                                 //43
        {label: '',             name: 'TRANSFER',   args: ['ENDWAY']},                                  //44
        {label: 'NOTEQY2',      name: 'TEST',       args: ['G', 'PosY', 'PosYDest2', 'LESSY2']},        //45
        {label: '',             name: 'ASSIGN',     args: ['PosY', 1, '-']},                            //46
        {label: '',             name: 'TRANSFER',   args: ['DRIVEY2']},                                 //47
        {label: 'LESSY2',       name: 'ASSIGN',     args: ['PosY', 1, '+']},                            //48
        {label: 'DRIVEY2',      name: 'ADVANCE',    args: [() => Exponential(5, 2) ]},                  //49
        {label: '',             name: 'TRANSFER',   args: ['MOVEY2']},                                  //50
        {label: 'ENDWAY',       name: 'LEAVE',      args: [CARS]},                                      //51
        {label: '',             name: 'LINK',       args: [FREE]},                                      //52
        {label: '',             name: 'TERMINATE',  args: []},                                          //53
    ];

    const blocks = model.map(({label, name}) => {
       return new Blocks[name](label);
    });

    const labels = model.map(({label}) => {
       return label;
    });

    const nameBlocks = model.map(({name}) => {
        return name;
    });

    const inputPhase = function() {
        model.forEach((block, idBlock) => {
            if (block['name'] === 'GENERATE') {
                const transact = blocks[idBlock].execute(idTransact, idBlock, modelTime, ...block.args);
                idTransact += block.args[1] || 1;

                CFE.push(transact);
                CFE = _.flatten(CFE);

                CFE = sortedByTime(CFE);
            }
        });
    };

    const timingCorrectionPhase = function() {
        const firstTransact = CFE.shift();
        modelTime = firstTransact.time;

        CCE.push(firstTransact);

        const copyCFE = CFE.concat();

        copyCFE.forEach((transact) => {
            if (transact.time === firstTransact.time) {
                CCE.push(CFE.shift());
            }
        })
    };

    const viewingPhase = function() {
        const copyCCE = CCE.concat();
        for (let i = 0; i < copyCCE.length; i++) {
            let currentTransact = copyCCE[i];

            console.log('---------');
            console.log(currentTransact);
            console.log('STAGES:');

            let {
                time,
                currentBlock,
                nextBlock,
            } = currentTransact;

            // запланировать приход другого тразнакта
            if (model[currentBlock].name === 'GENERATE' && time !== 0) {
                const newTransact = blocks[currentBlock].execute(idTransact, currentBlock, modelTime, ...model[currentBlock].args);
                idTransact += model[currentBlock].args[1] || 1;

                CFE.push(newTransact);
                CFE = _.flatten(CFE);

                CFE = sortedByTime(CFE);
            }

            let globalLeave = false;

            // продолжить продвижение транзакта по модели
            while (true) {

                time = currentTransact.time;
                currentBlock = currentTransact.currentBlock;
                nextBlock = currentTransact.nextBlock;

                console.log(nameBlocks[nextBlock], nextBlock);

                const {
                    isNextBlock,
                    isAdvance,
                    isLeave,
                    delay,
                    label,
                    idOldTransact,
                    newTransact
                } = blocks[nextBlock].execute(currentTransact, ...model[nextBlock].args, modelTime);

                globalLeave = globalLeave || isLeave;

                if (newTransact) {
                    currentTransact = newTransact;
                }

                if (isAdvance) {
                    _.remove(CCE, (value) => value.id === currentTransact.id);
                    CFE.push(currentTransact);
                    CFE = sortedByTime(CFE);
                }

                // delay - остановка в связи с занятостью устройства - не убирать транзакт и ЦТС
                if (!isNextBlock && delay) {
                    break;
                }

                if (!isNextBlock && globalLeave) {
                    _.remove(CCE, (value) => value.id === currentTransact.id);
                    viewingPhase();
                }

                if (!isNextBlock) {
                    _.remove(CCE, (value) => value.id === currentTransact.id);
                    break;
                }

                if (idOldTransact) {
                    _.remove(CCE, (value) => value.id === idOldTransact);
                }

                if (label) {
                    const nextId = labels.indexOf(label);
                    currentTransact.nextBlock = nextId;
                }

                if (isLeave) {
                    _.remove(CCE, (value) => value.id === currentTransact.id);
                }
            }

        }
    };

    inputPhase();

    while (modelTime < WORKING_DAY_TIME) {
        timingCorrectionPhase();
        console.log('-------------------------------------------');
        console.log('Фаза коррекции таймера:');
        console.log('Модельное время:', modelTime);
        console.log('ЦТС', CCE);
        console.log('ЦБС', CFE);
        viewingPhase();
        console.log('Фаза просмотра:');
        console.log('ЦТС', CCE);
        console.log('ЦБС', CFE);
        console.log('----');

    }

    console.log('LEAVE', blocks);
    console.log('QRequest:', QRequest.results());
    console.log('QWaitCar:', QWaitCar.results());
    console.log('QTripTime:', QTripTime.results());
    console.log('Result:', CARS.results());
})();
