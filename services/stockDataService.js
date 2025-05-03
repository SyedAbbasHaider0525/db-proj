const axios = require("axios");
const cron = require("node-cron");
const Stock = require("../models/stock");
const ApiLog = require("../models/ApiLog");
const MarketTrend = require("../models/MarketTrend");
const moment = require('moment');

// Function to fetch stock data from external API
async function fetchStockDataFromAPI(symbol) {
  try {
    console.log(`Mock fetching data for ${symbol}`);
    const mockData = {
      symbol: symbol,
      name: `${symbol} Inc.`,
      price: Math.random() * 1000 + 100,
      open: Math.random() * 1000 + 90,
      close: Math.random() * 1000 + 95,
      high: Math.random() * 1000 + 110,
      low: Math.random() * 1000 + 85,
      marketCap: Math.floor(Math.random() * 1000000000000),
      sector: ["Technology", "Healthcare", "Finance", "Energy"][Math.floor(Math.random() * 4)],
      exchange: ["NASDAQ", "NYSE"][Math.floor(Math.random() * 2)],
      movingAverage50: Math.random() * 1000 + 90,
      rsi: Math.random() * 100,
      bollingerUpper: Math.random() * 1000 + 120,
      bollingerMiddle: Math.random() * 1000 + 100,
      bollingerLower: Math.random() * 1000 + 80,
    };

    await ApiLog.create({
      End_Point_Indexes: `Mock API call for ${symbol}`,
      Response_Data: JSON.stringify(mockData),
      Status_Code: 200,
      Time_Stamp: moment().format('YYYY-MM-DD HH:mm:ss'),
    });
    
    return mockData;
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    await ApiLog.create({
      End_Point_Indexes: `https://api.example.com/stocks/${symbol}`,
      Response_Data: JSON.stringify(error.response?.data || error.message),
      Status_Code: error.response?.status || 500,
      Time_Stamp: moment().format('YYYY-MM-DD HH:mm:ss'),
    });
    
    throw error;
  }
}

// Mock data generator for fetchAndSaveStockData
function getMockStockData(symbol) {
  console.log(`Generating mock data for ${symbol}`);
  return {
    name: `${symbol} Inc.`,
    symbol: symbol,
    price: parseFloat((Math.random() * 100 + 50).toFixed(2)), // Ensure 2 decimal places
    open: parseFloat((Math.random() * 100 + 50).toFixed(2)),
    close: parseFloat((Math.random() * 100 + 50).toFixed(2)),
    high: parseFloat((Math.random() * 100 + 50).toFixed(2)),
    low: parseFloat((Math.random() * 100 + 50).toFixed(2)),
    marketCap: Math.floor(Math.random() * 1000000000) + 1000000000,
    sector: 'Technology',
    exchange: 'NASDAQ',
    movingAverage50: parseFloat((Math.random() * 1000 + 90).toFixed(2)),
    rsi: parseFloat((Math.random() * 100).toFixed(2)),
    bollingerUpper: parseFloat((Math.random() * 1000 + 120).toFixed(2)),
    bollingerMiddle: parseFloat((Math.random() * 1000 + 100).toFixed(2)),
    bollingerLower: parseFloat((Math.random() * 1000 + 80).toFixed(2))
  };
}

async function saveStockData(stockData) {
  try {
    if (!stockData.close) {
      console.warn(`Missing ClosingPrice for ${stockData.symbol}. Using fallback value.`);
      stockData.close = stockData.price || 0;
    }

    const stockInfo = {
      StockName: stockData.name || `${stockData.symbol} Inc.`,
      TickerSymbol: stockData.symbol,
      CurrentPrice: parseFloat(stockData.price.toFixed(2)), // Ensure 2 decimal places
      OpeningPrice: stockData.open ? parseFloat(stockData.open.toFixed(2)) : null,
      ClosingPrice: parseFloat(stockData.close.toFixed(2)),
      HighPrice: parseFloat(stockData.high.toFixed(2)),
      LowPrice: parseFloat(stockData.low.toFixed(2)),
      MarketCap: stockData.marketCap || 0,
      Sector: stockData.sector || 'Unknown',
      Exchange: stockData.exchange || 'Unknown',
      Timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
    };

    console.log(`Saving data for ${stockData.symbol}:`, stockInfo);

    const stock = await Stock.create(stockInfo);
    console.log(`Successfully saved data for ${stockData.symbol}`);
    return stock;
  } catch (error) {
    console.error(`Error saving stock data for ${stockData.symbol}:`, error);
    throw error;
  }
}

async function updateMarketTrend(stockId, stockData) {
  try {
    const trendData = {
      Stock_ID: stockId,
      Past_50_Days_Average: parseFloat(stockData.movingAverage50.toFixed(2)),
      Relative_Strength_Index: parseFloat(stockData.rsi.toFixed(2)),
      Bollinger_Bands: JSON.stringify({
        upper: parseFloat(stockData.bollingerUpper.toFixed(2)),
        middle: parseFloat(stockData.bollingerMiddle.toFixed(2)),
        lower: parseFloat(stockData.bollingerLower.toFixed(2)),
      }),
      Updated_Time_Stamp: moment().format('YYYY-MM-DD HH:mm:ss') // SQL Server compatible format
    };

    console.log(`Saving trend data for Stock_ID ${stockId}:`, trendData);

    const existingTrend = await MarketTrend.findOne({
      where: { Stock_ID: stockId },
    });

    if (existingTrend) {
      await existingTrend.update(trendData);
      console.log(`Updated existing market trend for Stock_ID ${stockId}`);
    } else {
      await MarketTrend.create(trendData);
      console.log(`Created new market trend for Stock_ID ${stockId}`);
    }
  } catch (error) {
    console.error(`Error updating market trend data for Stock_ID ${stockId}:`, error);
    throw error;
  }
}

async function fetchAndSaveStockData(symbols) {
  console.log('fetchAndSaveStockData called with symbols:', symbols, typeof symbols);
  if (!symbols || !Array.isArray(symbols)) {
    console.warn(`Invalid symbols parameter: ${symbols}. Using default symbols.`);
    symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
  }

  for (const symbol of symbols) {
    try {
      console.log(`Mock fetching data for ${symbol}`);
      const stockData = getMockStockData(symbol);
      const stock = await saveStockData(stockData);
      await updateMarketTrend(stock.StockID, stockData);
    } catch (error) {
      console.error(`Failed to update data for ${symbol}:`, error);
    }
  }
}

function scheduleStockDataFetch() {
  console.log('Setting up stock data fetch schedule');
  cron.schedule("0 9-17 * * 1-5", () => {
    console.log('Running scheduled stock data fetch');
    fetchAndSaveStockData(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']);
  });

  console.log('Starting initial stock data fetch');
  fetchAndSaveStockData(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']);
}

module.exports = {
  fetchStockDataFromAPI,
  saveStockData,
  fetchAndSaveStockData,
  scheduleStockDataFetch,
};