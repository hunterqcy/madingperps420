const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BINANCE_KLINE_URL = 'https://api.binance.com/api/v3/klines';

async function fetchHistoricalKlines(symbol = 'ETHUSDT', interval = '1m', startTime, endTime) {
  const limit = 1000;
  let allData = [];
  let currentTime = startTime;

  while (currentTime < endTime) {
    const url = `${BINANCE_KLINE_URL}?symbol=${symbol}&interval=${interval}&startTime=${currentTime}&limit=${limit}`;
    const response = await axios.get(url);
    const klines = response.data;

    if (klines.length === 0) break;

    allData.push(...klines);
    currentTime = klines[klines.length - 1][0] + 1;

    // 防止请求过快
    await new Promise((res) => setTimeout(res, 300));
  }

  return allData.map(kline => ({
    timestamp: kline[0],
    open: parseFloat(kline[1]),
    high: parseFloat(kline[2]),
    low: parseFloat(kline[3]),
    close: parseFloat(kline[4]),
    volume: parseFloat(kline[5])
  }));
}

async function saveKlinesToFile(symbol, interval, startTime, endTime, filename) {
  const data = await fetchHistoricalKlines(symbol, interval, startTime, endTime);
  fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(data, null, 2));
  console.log(`Saved ${data.length} candles to ${filename}`);
}

module.exports = { fetchHistoricalKlines, saveKlinesToFile };
