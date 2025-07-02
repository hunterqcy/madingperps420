const fs = require('fs');
const path = require('path');
const FuturesTradingStrategyClass = require('../core/futuresTradingStrategy');
const config = require('../../backpack_futures_config.json');

function simulateBacktest(data) {
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
      logs.push(`[${new Date(candle.timestamp).toISOString()}] BUY ${ethQty.toFixed(4)} ETH at ${price}`);
    } else if (signal.action === 'SELL' && position) {
      const sellValue = position.size * price;
      balance += sellValue;
      totalTradeVolumeUSDT += sellValue;
      totalTradeVolumeETH += position.size;
      logs.push(`[${new Date(candle.timestamp).toISOString()}] SELL ${position.size.toFixed(4)} ETH at ${price}`);
      position = null;
    }
  }

  logs.push(`Final Balance: ${balance.toFixed(2)} USDT`);
  logs.push(`Total Trade Volume: ${totalTradeVolumeUSDT.toFixed(2)} USDT / ${totalTradeVolumeETH.toFixed(4)} ETH`);
  return logs;
}

function run() {
  const dataPath = path.join(__dirname, 'ethusdt_1m.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  const resultLogs = simulateBacktest(data);
  resultLogs.forEach(log => console.log(log));

  // 写入日志文件
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFilePath = path.join(__dirname, '../../logs', `backtest-${timestamp}.log`);

  fs.writeFileSync(logFilePath, resultLogs.join('\n'), 'utf-8');
  console.log(`✅ Backtest log saved to: ${logFilePath}`);
}

run();
