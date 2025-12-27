const fs = require('fs');
const path = require('path');

let stocksData = null;

// 載入股票清單
function loadStocks() {
  if (stocksData) return stocksData;
  
  try {
    const filePath = path.join(__dirname, '../stocks.json');
    const data = fs.readFileSync(filePath, 'utf8');
    stocksData = JSON.parse(data);
    return stocksData;
  } catch (error) {
    console.error('載入股票清單失敗:', error);
    return {};
  }
}

// 取得股票名稱
function getStockName(code) {
  const stocks = loadStocks();
  return stocks[code] || null;
}

// 搜尋股票（模糊搜尋）
function searchStocks(keyword, limit = 10) {
  const stocks = loadStocks();
  const results = [];
  
  for (const [code, name] of Object.entries(stocks)) {
    if (code.includes(keyword) || name.includes(keyword)) {
      results.push({ code, name });
      if (results.length >= limit) break;
    }
  }
  
  return results;
}

module.exports = {
  getStockName,
  searchStocks
};
