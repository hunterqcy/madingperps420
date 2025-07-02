const fs = require('fs');
const path = require('path');
const FuturesTradingStrategyClass = require('../core/futuresTradingStrategy');
const config = require('../../backpack_futures_config.json');

function simulateBacktest(data, coin) {
  let tradingStrategy = new FuturesTradingStrategyClass();
  let balance = config.futures.totalAmount;
  let position = null;
  let logs = [];
  let totalTradeVolumeUSDT = 0;
  let totalTradeVolumeETH = 0;

  for (const candle of data) {
    const price = candle.close;

    const signal = tradingStrategy.evaluateMarket(
      price,
      position,
      config.futures,
      config.riskManagement
    );

    if (signal.action === 'BUY') {
      const orderSize = signal.orderSize || config.futures.totalAmount / config.futures.orderCount;
      const ethQty = orderSize / price;
      position = {
        entryPrice: price,
        size: ethQty,
        type: 'LONG'
      };
      balance -= orderSize;
      totalTradeVolumeUSDT += orderSize;
      totalTradeVolumeETH += ethQty;
      logs.push(`[${new Date(candle.timestamp).toISOString()}] BUY ${ethQty.toFixed(4)} ${coin} at ${price}`);
    } else if (signal.action === 'SELL' && position) {
      const sellValue = position.size * price;
      balance += sellValue;
      totalTradeVolumeUSDT += sellValue;
      totalTradeVolumeETH += position.size;
      logs.push(`[${new Date(candle.timestamp).toISOString()}] SELL ${position.size.toFixed(4)} ${coin} at ${price}`);
      position = null;
    }
  }

  logs.push(`Final Balance: ${balance.toFixed(2)} USDT`);
  logs.push(`Total Trade Volume: ${totalTradeVolumeUSDT.toFixed(2)} USDT / ${totalTradeVolumeETH.toFixed(4)} ${coin}`);
  return logs;
}

function run(fileName) {
  let defaultFileName = 'ethusdt_1m.json'
  if (fileName) {
    defaultFileName = fileName
  }
  let coinIndex = defaultFileName.indexOf("usdt");
  let coin = defaultFileName.substring(0,coinIndex);
  const dataPath = path.join(__dirname, defaultFileName);
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const resultLogs = simulateBacktest(data, coin);
  resultLogs.forEach(log => console.log(log));

  // 写入日志文件
  const timestamp = formatTimestampUTC8();
  const logFilePath = path.join(__dirname, '../../logs', `backtest-${timestamp}.log`);

  fs.writeFileSync(logFilePath, resultLogs.join('\n'), 'utf-8');
  console.log(`✅ Backtest log saved to: ${logFilePath}`);
}

function formatTimestampUTC8() {
  const now = new Date();
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 加8小时偏移
  const yyyy = utc8.getUTCFullYear();
  const mm = String(utc8.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc8.getUTCDate()).padStart(2, '0');
  const hh = String(utc8.getUTCHours()).padStart(2, '0');
  const min = String(utc8.getUTCMinutes()).padStart(2, '0');
  const ss = String(utc8.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

// 获取命令行参数并传给 run()
const args = process.argv.slice(2);
const fileName = args[0];
run(fileName);
