// 在一个脚本中调用
const { saveKlinesToFile } = require('./backtest/binanceDataLoader');
const ONE_DAY = 24 * 60 * 60 * 1000;
const endTime = Date.now();
const startTime = endTime - ONE_DAY * 30;

saveKlinesToFile('ETHUSDT', '1m', startTime, endTime, 'ethusdt_1m.json');